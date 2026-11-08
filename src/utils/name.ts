/** İsim doğrulama: 2–20 karakter, baş/son boşluklar silinir. */
export function validateName(raw: string): {
  ok: boolean
  value: string
  error?: 'tooShort' | 'tooLong'
} {
  const value = raw.trim()
  if (value.length < 2) return { ok: false, value, error: 'tooShort' }
  if (value.length > 20) return { ok: false, value, error: 'tooLong' }
  return { ok: true, value }
}
