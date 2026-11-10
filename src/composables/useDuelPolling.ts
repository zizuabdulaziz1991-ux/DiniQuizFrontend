import { onBeforeUnmount, ref } from 'vue'
import { getDuel } from '@/api/duel'
import { apiStatus } from '@/api/client'
import type { DuelState } from '@/types/api'

/**
 * Yarış durumunu düzenli aralıkla sunucudan okur (WebSocket yok; ücretsiz sunucuda yoklama yeterli).
 * İstekler üst üste binmez; yarış bitince ya da ölümcül hatada (403/404/410) durur.
 */
export function useDuelPolling(opts: {
  code: () => string
  token: () => string | null
  onState: (s: DuelState) => void
  onFatal: (status: number | null) => void
  intervalMs?: number
}) {
  const interval = opts.intervalMs ?? 1000
  const connectionLost = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  let running = false
  let inflight = false
  let fails = 0

  function clear() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  async function tick() {
    if (!running || inflight) return
    const token = opts.token()
    if (!token) return
    inflight = true
    try {
      const state = await getDuel(opts.code(), token)
      fails = 0
      connectionLost.value = false
      opts.onState(state)
      if (state.status === 'finished' || state.status === 'expired') {
        stop()
        return
      }
    } catch (e) {
      const status = apiStatus(e)
      if (status === 403 || status === 404 || status === 410) {
        stop()
        opts.onFatal(status)
        return
      }
      fails++
      if (fails >= 3) connectionLost.value = true
    } finally {
      inflight = false
    }
    if (running) timer = setTimeout(tick, interval)
  }

  function start() {
    if (running) return
    running = true
    void tick()
  }

  function stop() {
    running = false
    clear()
  }

  /** Cevaptan hemen sonra beklemeden durumu yenile. */
  function pollNow() {
    if (!running || inflight) return
    clear()
    void tick()
  }

  onBeforeUnmount(stop)
  return { start, stop, pollNow, connectionLost }
}
