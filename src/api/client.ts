import axios from 'axios'
import { currentLocale } from '@/i18n'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  timeout: 10000,
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

http.interceptors.request.use((config) => {
  config.headers.set('Accept-Language', currentLocale())
  const s = loadSession()
  if (s && config.url?.includes('/sessions/' + s.sessionId)) {
    config.headers.set('X-Session-Token', s.token)
  }
  return config
})

export function apiStatus(e: unknown): number | null {
  return axios.isAxiosError(e) ? (e.response?.status ?? null) : null
}
