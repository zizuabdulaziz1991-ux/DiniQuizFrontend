/** İsim doğrulama: 2–20 karakter, baş/son boşluklar silinir. */
export function validateName(raw: string): { ok: boolean; value: string; error?: string } {
  const value = raw.trim()
  if (value.length < 2) return { ok: false, value, error: 'İsim en az 2 karakter olmalı.' }
  if (value.length > 20) return { ok: false, value, error: 'İsim en fazla 20 karakter olabilir.' }
  return { ok: true, value }
}
