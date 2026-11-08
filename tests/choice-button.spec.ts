import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChoiceButton from '@/components/ChoiceButton.vue'

const mk = (state?: 'normal' | 'selected' | 'correct' | 'wrong', disabled = false) =>
  mount(ChoiceButton, { props: { label: 'A', text: 'Hira', state, disabled } })

describe('ChoiceButton', () => {
  it('normal durum', () => {
    const w = mk('normal')
    expect(w.classes()).toContain('bg-surface')
    expect(w.text()).not.toContain('✓')
  })
  it('seçili durum', () => expect(mk('selected').classes()).toContain('border-primary'))
  it('doğru durum ✓ gösterir', () => {
    const w = mk('correct')
    expect(w.classes()).toContain('bg-success')
    expect(w.text()).toContain('✓')
  })
  it('yanlış durum ✕ gösterir', () => {
    const w = mk('wrong')
    expect(w.classes()).toContain('bg-danger')
    expect(w.text()).toContain('✕')
  })
  it('aria-label içerir ve tıklanınca pick yayar', async () => {
    const w = mk()
    expect(w.attributes('aria-label')).toBe('A: Hira')
    await w.trigger('click')
    expect(w.emitted('pick')).toHaveLength(1)
  })
  it('devre dışıyken tıklanamaz', async () => {
    const w = mk('normal', true)
    await w.trigger('click')
    expect(w.emitted('pick')).toBeUndefined()
  })
})
