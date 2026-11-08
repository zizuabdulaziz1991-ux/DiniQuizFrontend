import { onBeforeUnmount, ref } from 'vue'

/** Sunucudan gelen remaining_ms ile geri sayım. Sayaç sadece görseldir. */
export function useCountdown(onExpire: () => void) {
  const remainingMs = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null
  let endAt = 0

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function start(ms: number) {
    stop()
    endAt = Date.now() + ms
    remainingMs.value = Math.max(0, ms)
    if (ms <= 0) {
      onExpire()
      return
    }
    timer = setInterval(() => {
      remainingMs.value = Math.max(0, endAt - Date.now())
      if (remainingMs.value <= 0) {
        stop()
        onExpire()
      }
    }, 100)
  }

  onBeforeUnmount(stop)
  return { remainingMs, start, stop }
}
