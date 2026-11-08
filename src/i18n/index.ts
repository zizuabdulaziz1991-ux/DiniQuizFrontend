import { createI18n } from 'vue-i18n'
import tr from './tr'
import uz from './uz'

export const DEFAULT_LOCALE = 'tr'
const STORAGE_KEY = 'diniquiz.lang'

/** Arayüz metinleri hazır olan diller. Yeni dil için src/i18n/<kod>.ts ekleyip buraya yazın. */
export const messages = { tr, uz }

/** 'uz-UZ', 'UZ', 'uz_Latn' -> 'uz'. Desteklenmiyorsa null. */
export function normalizeLocale(raw: string | null | undefined): string | null {
  if (!raw) return null
  const code = raw.trim().toLowerCase().replace('_', '-').split('-')[0]
  return code in messages ? code : null
}

export function loadSavedLocale(): string | null {
  try {
    return normalizeLocale(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function saveLocale(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* depolama kapalıysa sessizce geç */
  }
}

/** Sıra: kayıtlı seçim > tarayıcı dili > Türkçe. IP ile ülke tespiti kullanılmaz. */
export function detectInitialLocale(): string {
  const saved = loadSavedLocale()
  if (saved) return saved
  const preferred =
    typeof navigator !== 'undefined' ? (navigator.languages ?? [navigator.language]) : []
  for (const lang of preferred) {
    const found = normalizeLocale(lang)
    if (found) return found
  }
  return DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: detectInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
})

export function currentLocale(): string {
  return i18n.global.locale.value
}

export function setLocale(code: string): void {
  const normalized = normalizeLocale(code) ?? DEFAULT_LOCALE
  i18n.global.locale.value = normalized as 'tr' | 'uz'
  saveLocale(normalized)
  if (typeof document !== 'undefined') document.documentElement.lang = normalized
}
