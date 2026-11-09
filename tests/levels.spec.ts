import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { i18n, setLocale } from '@/i18n'

const api = vi.hoisted(() => ({
  getLevels: vi.fn(),
  getCategories: vi.fn(),
  startSession: vi.fn(),
  getResult: vi.fn(),
}))
vi.mock('@/api/quiz', () => api)

import LevelView from '@/views/LevelView.vue'
import ResultView from '@/views/ResultView.vue'

const ten = (overrides: Record<number, object> = {}) =>
  Array.from({ length: 10 }, (_, i) => ({
    level: i + 1,
    status: i === 0 ? 'unlocked' : 'locked',
    question_count: 10,
    ...(overrides[i + 1] ?? {}),
  }))

function makeRouter() {
  const stub = { template: '<div />' }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: stub },
      { path: '/kategoriler', component: stub },
      { path: '/kategori/:slug', name: 'levels', component: stub },
      { path: '/quiz/:sessionId', name: 'quiz', component: stub },
      { path: '/isim/:sessionId', component: stub },
    ],
  })
}

async function mountLevels() {
  const router = makeRouter()
  const w = mount(LevelView, {
    props: { slug: 'kuran' },
    global: { plugins: [createPinia(), i18n, router] },
  })
  await flushPromises()
  return { w, router }
}

describe('LevelView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    setLocale('tr')
    api.getCategories.mockResolvedValue([{ id: 5, slug: 'kuran', name: "Kur'an", color: '#22B573' }])
  })

  it('10 seviye kutusunu gösterir: 1. açık, diğerleri kilitli', async () => {
    api.getLevels.mockResolvedValue({ category: 'kuran', level_count: 10, questions_per_level: 10, levels: ten() })
    const { w } = await mountLevels()
    const tiles = w.findAll('[data-status]')
    expect(tiles).toHaveLength(10)
    expect(tiles[0].attributes('data-status')).toBe('unlocked')
    expect(tiles.slice(1).every((t) => t.attributes('data-status') === 'locked')).toBe(true)
    expect(w.text()).toContain("Kur'an")
  })

  it('kilitli seviyeye basınca ipucu çıkar ve oturum başlatılmaz', async () => {
    api.getLevels.mockResolvedValue({ category: 'kuran', level_count: 10, questions_per_level: 10, levels: ten() })
    const { w } = await mountLevels()
    await w.findAll('[data-status]')[2].trigger('click')
    expect(w.text()).toContain('%100 tamamlamalısın')
    expect(api.startSession).not.toHaveBeenCalled()
  })

  it('"yakında" (boş) seviyeye basınca oturum başlatılmaz', async () => {
    api.getLevels.mockResolvedValue({
      category: 'kuran', level_count: 10, questions_per_level: 10,
      levels: ten({ 3: { status: 'empty', question_count: 0 } }),
    })
    const { w } = await mountLevels()
    await w.findAll('[data-status]')[2].trigger('click')
    expect(w.text()).toContain('henüz soru yok')
    expect(api.startSession).not.toHaveBeenCalled()
  })

  it('açık seviyeye basınca o seviyeyle oturum başlatır ve quize gider', async () => {
    api.getLevels.mockResolvedValue({
      category: 'kuran', level_count: 10, questions_per_level: 10,
      levels: ten({ 2: { status: 'unlocked' }, 1: { status: 'completed', attempts: 2, best_correct: 10 } }),
    })
    api.startSession.mockResolvedValue({
      session_id: 's1', token: 'tok', category: 'kuran', level: 2, total_questions: 10, time_limit_seconds: 30,
    })
    const { w, router } = await mountLevels()
    await w.findAll('[data-status]')[1].trigger('click')
    await flushPromises()
    expect(api.startSession).toHaveBeenCalledWith('kuran', 'tr', 2)
    expect(router.currentRoute.value.name).toBe('quiz')
  })

  it('sunucu level_locked dönerse kilit mesajı gösterir', async () => {
    api.getLevels.mockResolvedValue({
      category: 'kuran', level_count: 10, questions_per_level: 10, levels: ten({ 2: { status: 'unlocked' } }),
    })
    api.startSession.mockRejectedValue(
      Object.assign(new Error('403'), { isAxiosError: true, response: { status: 403, data: { code: 'level_locked' } } }),
    )
    const { w } = await mountLevels()
    await w.findAll('[data-status]')[1].trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Bu seviye kilitli')
  })
})

describe('ResultView seviye sonucu', () => {
  const base = {
    score: 1200, max_score: 1500, rank_preview: 30, correct_count: 10, wrong_count: 0, empty_count: 0,
    total_questions: 10, level: 1,
  }

  async function mountResult(result: object) {
    sessionStorage.setItem(
      'diniquiz.session',
      JSON.stringify({ sessionId: 's1', token: 't', category: 'kuran', level: 1 }),
    )
    api.getResult.mockResolvedValue({ ...base, ...result })
    const router = makeRouter()
    const w = mount(ResultView, {
      props: { sessionId: 's1' },
      global: { plugins: [createPinia(), i18n, router] },
    })
    await flushPromises()
    return w
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    setLocale('tr')
  })

  it('10/10 ve sonraki seviye yeni açıldıysa açıldı mesajı ve "Sonraki seviye" butonu', async () => {
    const w = await mountResult({ perfect: true, next_level: 2, newly_unlocked: true })
    expect(w.text()).toContain('Seviye 2 açıldı')
    expect(w.text()).toContain('Sonraki seviye')
    expect(w.text()).not.toContain('Seviyeyi tekrar dene')
  })

  it('10/10 ama sonraki seviye yoksa "yeni seviyeler yakında" der', async () => {
    const w = await mountResult({ perfect: true, next_level: null })
    expect(w.text()).toContain('Yeni seviyeler yakında')
    expect(w.text()).not.toContain('Sonraki seviye')
  })

  it('%100 değilse hedefi söyler ve "Seviyeyi tekrar dene" sunar', async () => {
    const w = await mountResult({ perfect: false, correct_count: 7, wrong_count: 3, level_passed: false, next_level: null })
    expect(w.text()).toContain('Maşallah! 7/10 doğru')
    expect(w.text()).toContain('tüm soruları doğru bildiğinde açılır')
    expect(w.text()).toContain('Seviyeyi tekrar dene')
    expect(w.text()).not.toContain('açıldı')
  })

  it('sonraki seviye henüz boşsa (onay bekliyor) "Sonraki seviye" sunulmaz', async () => {
    api.getLevels.mockResolvedValue({
      category: 'kuran', level_count: 10, questions_per_level: 10,
      levels: [{ level: 3, status: 'empty', question_count: 0 }],
    })
    const w = await mountResult({ perfect: true, next_level: 3, newly_unlocked: true })
    expect(w.text()).toContain('Yeni seviyeler yakında')
    expect(w.text()).not.toContain('Seviye 3 açıldı')
    expect(w.findAll('button').some((b) => b.text() === 'Sonraki seviye')).toBe(false)
  })

  it('sunucu level_empty dönerse "henüz soru yok" mesajı gösterir', async () => {
    api.getLevels.mockResolvedValue({
      category: 'kuran', level_count: 10, questions_per_level: 10,
      levels: [{ level: 2, status: 'unlocked', question_count: 10 }],
    })
    api.startSession.mockRejectedValue(
      Object.assign(new Error('409'), { isAxiosError: true, response: { status: 409, data: { code: 'level_empty' } } }),
    )
    const w = await mountResult({ perfect: true, next_level: 2, newly_unlocked: true })
    await w.findAll('button').find((b) => b.text() === 'Sonraki seviye')!.trigger('click')
    await flushPromises()
    expect(w.text()).toContain('henüz soru yok')
  })

  it('sonraki seviye "Sonraki seviye" ile o seviyeyi başlatır', async () => {
    api.startSession.mockResolvedValue({
      session_id: 's2', token: 't2', category: 'kuran', level: 2, total_questions: 10, time_limit_seconds: 30,
    })
    const w = await mountResult({ perfect: true, next_level: 2, newly_unlocked: true })
    await w.findAll('button').find((b) => b.text() === 'Sonraki seviye')!.trigger('click')
    await flushPromises()
    expect(api.startSession).toHaveBeenCalledWith('kuran', 'tr', 2)
  })
})
