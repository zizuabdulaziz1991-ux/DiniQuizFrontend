import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { detectInitialLocale, messages, normalizeLocale, saveLocale } from '@/i18n'

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') out[key] = v
    else Object.assign(out, flatten(v as Record<string, unknown>, key))
  }
  return out
}

describe('çeviri dosyaları', () => {
  const tr = flatten(messages.tr)
  const uz = flatten(messages.uz)

  it('Türkçe ve Özbekçe aynı anahtarlara sahip', () => {
    expect(Object.keys(uz).sort()).toEqual(Object.keys(tr).sort())
  })

  it('hiçbir çeviri boş değil', () => {
    for (const [k, v] of Object.entries(uz)) expect(v.trim(), k).not.toBe('')
  })

  it('yer tutucular ({n}, {index} ...) iki dilde de aynı', () => {
    const holders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const k of Object.keys(tr)) expect(holders(uz[k]), k).toEqual(holders(tr[k]))
  })
})

describe('dil seçimi', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('bölge kodlu ve farklı yazımlı dilleri tanır', () => {
    expect(normalizeLocale('uz-UZ')).toBe('uz')
    expect(normalizeLocale('UZ')).toBe('uz')
    expect(normalizeLocale('uz_Latn')).toBe('uz')
    expect(normalizeLocale('tr-TR')).toBe('tr')
  })

  it('desteklenmeyen ya da boş dili reddeder', () => {
    expect(normalizeLocale('ru')).toBeNull()
    expect(normalizeLocale('')).toBeNull()
    expect(normalizeLocale(null)).toBeNull()
  })

  it('kayıtlı seçim tarayıcı dilinden önceliklidir', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['tr-TR'])
    saveLocale('uz')
    expect(detectInitialLocale()).toBe('uz')
  })

  it('kayıt yoksa tarayıcı dili kullanılır', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ru-RU', 'uz-UZ'])
    expect(detectInitialLocale()).toBe('uz')
  })

  it('hiçbiri desteklenmiyorsa Türkçe', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE'])
    expect(detectInitialLocale()).toBe('tr')
  })
})
