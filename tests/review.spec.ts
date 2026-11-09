import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { i18n, setLocale } from '@/i18n'
import { useQuizStore } from '@/stores/quiz'
import ReviewView from '@/views/ReviewView.vue'
import type { ReviewItem } from '@/types/api'

const item = (id: number, correct: number, explanation: string | null = null): ReviewItem => ({
  question: {
    id,
    text: `Soru ${id}`,
    arabic_text: null,
    choices: [
      { id: id * 10 + 1, text: 'Şık 1' },
      { id: id * 10 + 2, text: 'Şık 2' },
      { id: id * 10 + 3, text: 'Şık 3' },
      { id: id * 10 + 4, text: 'Şık 4' },
    ],
  },
  correctChoiceId: id * 10 + correct,
  explanation,
})

function setup(mistakes: ReviewItem[]) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useQuizStore()
  store.mistakes = mistakes
  const stub = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: stub },
      { path: '/duzelt/:sessionId', name: 'review', component: stub },
      { path: '/sonuc/:sessionId', name: 'result', component: stub },
    ],
  })
  const w = mount(ReviewView, { props: { sessionId: 's1' }, global: { plugins: [pinia, i18n, router] } })
  return { w, store, router }
}

const buttons = (w: ReturnType<typeof setup>['w']) => w.findAll('button')

describe('yanlışları düzeltme turu', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setLocale('tr')
  })
  afterEach(() => vi.useRealTimers())

  it('ilk yanlış soruyu ve kalan sayısını gösterir', () => {
    const { w } = setup([item(1, 2), item(2, 3)])
    expect(w.text()).toContain('Soru 1')
    expect(w.text()).toContain('Kalan: 2')
  })

  it('yanlış şıkta aynı soru kalır, o şık kapanır ve ipucu çıkar', async () => {
    const { w } = setup([item(1, 2), item(2, 3)])
    await buttons(w)[0].trigger('click') // yanlış
    expect(w.text()).toContain('Soru 1')
    expect(w.text()).toContain('Kalan: 2')
    expect(buttons(w)[0].attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('başka bir şık dene')
  })

  it('doğru şıkta açıklama çıkar ve gecikmeden sonra sıradaki yanlışa geçer', async () => {
    const { w } = setup([item(1, 2, 'Açıklama 1'), item(2, 3)])
    await buttons(w)[1].trigger('click') // doğru
    expect(w.text()).toContain('Doğru! 🎉')
    expect(w.text()).toContain('Açıklama 1')
    vi.advanceTimersByTime(2000)
    await flushPromises()
    expect(w.text()).toContain('Soru 2')
    expect(w.text()).toContain('Kalan: 1')
  })

  it('hepsi doğru bilinince sonuç ekranına gider', async () => {
    const { w, router, store } = setup([item(1, 1)])
    await buttons(w)[0].trigger('click')
    vi.advanceTimersByTime(2000)
    await flushPromises()
    expect(store.mistakes).toHaveLength(0)
    expect(router.currentRoute.value.fullPath).toBe('/sonuc/s1')
  })

  it('düzeltilecek soru yoksa (sayfa yenileme) doğrudan sonuca geçer', async () => {
    const { router } = setup([])
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/sonuc/s1')
  })

  it('doğru bulunduktan sonra tekrar tıklamak soruyu bozmaz', async () => {
    const { w, store } = setup([item(1, 2), item(2, 3)])
    await buttons(w)[1].trigger('click')
    await buttons(w)[0].trigger('click')
    vi.advanceTimersByTime(2000)
    expect(store.mistakes).toHaveLength(1)
  })
})
