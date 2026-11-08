import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { currentLocale } from '@/i18n'
import { slowRequests } from '@/composables/useServerStatus'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Kaçıncı yeniden deneme (iç kullanım). */
    __retry?: number
    /** Uyanma şeridi bu istek için sayılıyor mu (iç kullanım). */
    __waking?: boolean
  }
}

/** Uyku sonrası soğuk başlatma 30–60 sn sürebilir; testler bu değerleri değiştirebilir. */
export const wakeConfig = { retries: 3, delayMs: 3000, slowAfterMs: 4000, timeoutMs: 60000 }

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  timeout: wakeConfig.timeoutMs,
  headers: { 'Content-Type': 'application/json' },
})

const KEY = 'diniquiz.session'

export interface StoredSession {
  sessionId: string
  token: string
}

export function saveSession(s: StoredSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* depolama kapalıysa sessizce geç */
  }
}

export function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* yoksay */
  }
}

// --- Yavaş istek takibi: 4 sn'den uzun süren istek "sunucu uyanıyor" şeridini açar ---
const timers = new Map<object, ReturnType<typeof setTimeout>>()
const flagged = new WeakSet<object>()

function startTimer(config: InternalAxiosRequestConfig): void {
  const t = setTimeout(() => {
    flagged.add(config)
    slowRequests.value++
  }, wakeConfig.slowAfterMs)
  timers.set(config, t)
}

function stopTimer(config: object): void {
  const t = timers.get(config)
  if (t) {
    clearTimeout(t)
    timers.delete(config)
  }
  if (flagged.has(config)) {
    flagged.delete(config)
    slowRequests.value = Math.max(0, slowRequests.value - 1)
  }
}

function endWaking(config: { __waking?: boolean }): void {
  if (config.__waking) {
    config.__waking = false
    slowRequests.value = Math.max(0, slowRequests.value - 1)
  }
}

http.interceptors.request.use((config) => {
  config.headers.set('Accept-Language', currentLocale())
  const s = loadSession()
  if (s && config.url?.includes('/sessions/' + s.sessionId)) {
    config.headers.set('X-Session-Token', s.token)
  }
  startTimer(config)
  return config
})

http.interceptors.response.use(
  (response) => {
    stopTimer(response.config)
    endWaking(response.config)
    return response
  },
  async (error: AxiosError) => {
    const config = error.config
    if (!config) throw error
    stopTimer(config)

    const status = error.response?.status
    const gatewayDown = status === 502 || status === 503 || status === 504
    const isGet = (config.method ?? 'get').toLowerCase() === 'get'
    // Yanıt hiç gelmediyse (zaman aşımı/ağ) yalnızca GET güvenle tekrarlanır.
    const retriable = gatewayDown || (!error.response && isGet)
    const attempt = config.__retry ?? 0

    if (retriable && attempt < wakeConfig.retries) {
      config.__retry = attempt + 1
      if (!config.__waking) {
        config.__waking = true
        slowRequests.value++ // yeniden denerken şerit kapanıp açılmasın
      }
      await new Promise((resolve) => setTimeout(resolve, wakeConfig.delayMs))
      return http(config)
    }

    endWaking(config)
    throw error
  },
)

export function apiStatus(e: unknown): number | null {
  return axios.isAxiosError(e) ? (e.response?.status ?? null) : null
}
