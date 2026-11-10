export interface DuelAuth {
  token: string
  role: 'host' | 'guest'
  name: string
}

const key = (code: string) => `diniquiz.duel.${code.toUpperCase()}`
const NAME_KEY = 'diniquiz.player_name'

/** Yarış kodunu normalleştirir: büyük harf, yalnızca harf/rakam, en çok 6 karakter. */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

export function loadDuelAuth(code: string): DuelAuth | null {
  try {
    const raw = localStorage.getItem(key(code))
    if (!raw) return null
    const v = JSON.parse(raw) as DuelAuth
    return v && typeof v.token === 'string' ? v : null
  } catch {
    return null
  }
}

export function saveDuelAuth(code: string, auth: DuelAuth): void {
  try {
    localStorage.setItem(key(code), JSON.stringify(auth))
  } catch {
    /* depolama kapalıysa sessizce geç */
  }
}

export function getSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    /* yoksay */
  }
}
