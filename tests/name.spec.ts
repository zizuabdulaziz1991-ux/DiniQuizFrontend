import { describe, it, expect } from 'vitest'
import { validateName } from '@/utils/name'

describe('validateName', () => {
  it('çok kısa ismi reddeder', () => expect(validateName('A').ok).toBe(false))
  it('çok uzun ismi reddeder', () => expect(validateName('a'.repeat(21)).ok).toBe(false))
  it('boşlukları kırpar', () => expect(validateName('  Ahmet ')).toMatchObject({ ok: true, value: 'Ahmet' }))
  it('sınırları kabul eder', () => {
    expect(validateName('Al').ok).toBe(true)
    expect(validateName('a'.repeat(20)).ok).toBe(true)
  })
  it('Türkçe karakterlere izin verir', () => expect(validateName('Şükrü').ok).toBe(true))
})
