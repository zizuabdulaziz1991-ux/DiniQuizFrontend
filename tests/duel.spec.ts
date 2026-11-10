import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n, setLocale } from '@/i18n'

const api = vi.hoisted(() => ({
  createDuel: vi.fn(),
  joinDuel: vi.fn(),
  getDuel: vi.fn(),
  answerDuel: vi.fn(),
  getCategories: vi.fn(),
  getLevels: vi.fn(),
}))
vi.mock('@/api/duel', () => ({
  createDuel: api.createDuel,
  joinDuel: api.joinDuel,
  getDuel: api.getDuel,
  answerDuel: api.answerDuel,
}))
vi.mock('@/api/quiz', () => ({ getCategories: api.getCategories, getLevels: api.getLevels }))

import { useDuelPolling } from '@/composables/useDuelPolling'
import DuelRoomView from '@/views/DuelRoomView.vue'
import DuelLobbyView from '@/views/DuelLobbyView.vue'
import { loadDuelAuth, normalizeCode, saveDuelAuth } from '@/utils/duelAuth'

const httpError = (status: number, code?: string) =>
  Object.assign(new Error(String(status)), { isAxiosError: true, response: { status, data: { code } } })

const state = (over: Record<string, unknown> = {}) => ({
  code: 'ABC123', status: 'active', phase: 'question', category: 'kuran', level: 1,
  total_questions: 10, time_limit_seconds: 30, starts_in_ms: null, index: 0,
  question: {
    id: 7, text: 'Soru 7', arabic_text: null,
    choices: [{ id: 71, text: 'A1' }, { id: 72, text: 'B1' }, { id: 73, text: 'C1' }, { id: 74, text: 'D1' }],
  },
  remaining_ms: 25000,
  me: { name: 'Ali', answered: false, correct: 0, points: 0 },
  opponent: { name: 'Veli', answered: false, correct: 0, points: 0, connected: true },
  reveal: null, result: null,
  ...over,
})

function makeRouter() {
  const stub = { template: '<div />' }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: stub },
      { path: '/yaris', name: 'duel-lobby', component: stub },
      { path: '/duello/:code', name: 'duel-room', component: stub },
    ],
  })
}

describe('yarış kodu ve kimlik saklama', () => {
  beforeEach(() => localStorage.clear())

  it('kodu büyük harfe çevirir, harf/rakam dışını atar, 6 karakterle sınırlar', () => {
    expect(normalizeCode('ab-c 12x34')).toBe('ABC12X')
  })

  it('oyuncu belirtecini kod bazında saklar', () => {
    saveDuelAuth('abc123', { token: 't1', role: 'host', name: 'Ali' })
    expect(loadDuelAuth('ABC123')).toEqual({ token: 't1', role: 'host', name: 'Ali' })
    expect(loadDuelAuth('ZZZZZZ')).toBeNull()
  })
})

describe('useDuelPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })
  afterEach(() => vi.useRealTimers())

  function setup(extra: { onFatal?: (s: number | null) => void } = {}) {
    const states: unknown[] = []
    let api_!: ReturnType<typeof useDuelPolling>
    mount(
      defineComponent({
        setup() {
          api_ = useDuelPolling({
            code: () => 'ABC123',
            token: () => 'tok',
            onState: (s) => states.push(s),
            onFatal: extra.onFatal ?? (() => {}),
            intervalMs: 1000,
          })
          return () => null
        },
      }),
    )
    return { poll: api_, states }
  }

  it('belirli aralıkla yoklar', async () => {
    api.getDuel.mockResolvedValue(state())
    const { poll, states } = setup()
    poll.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(states).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(2100)
    expect(states.length).toBeGreaterThanOrEqual(3)
    poll.stop()
  })

  it('yarış bitince yoklamayı durdurur', async () => {
    api.getDuel.mockResolvedValue(state({ status: 'finished', phase: 'finished' }))
    const { poll } = setup()
    poll.start()
    await vi.advanceTimersByTimeAsync(5000)
    expect(api.getDuel).toHaveBeenCalledTimes(1)
  })

  it('404 gibi ölümcül hatada durur ve bildirir', async () => {
    api.getDuel.mockRejectedValue(httpError(404))
    const onFatal = vi.fn()
    const { poll } = setup({ onFatal })
    poll.start()
    await vi.advanceTimersByTimeAsync(5000)
    expect(onFatal).toHaveBeenCalledWith(404)
    expect(api.getDuel).toHaveBeenCalledTimes(1)
  })

  it('ağ hatasında vazgeçmez, 3 ardışık hatadan sonra bağlantı koptu der', async () => {
    api.getDuel.mockRejectedValue(new Error('Network Error'))
    const { poll } = setup()
    poll.start()
    await vi.advanceTimersByTimeAsync(3500)
    expect(api.getDuel.mock.calls.length).toBeGreaterThanOrEqual(3)
    expect(poll.connectionLost.value).toBe(true)
    api.getDuel.mockResolvedValue(state())
    await vi.advanceTimersByTimeAsync(1500)
    expect(poll.connectionLost.value).toBe(false)
    poll.stop()
  })

  it('istekler üst üste binmez', async () => {
    let resolve!: (v: unknown) => void
    api.getDuel.mockImplementation(() => new Promise((r) => (resolve = r)))
    const { poll } = setup()
    poll.start()
    await vi.advanceTimersByTimeAsync(5000)
    expect(api.getDuel).toHaveBeenCalledTimes(1)
    resolve(state())
    poll.stop()
  })
})

describe('DuelRoomView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
    setLocale('tr')
    vi.stubEnv('VITE_SITE_URL', 'https://diniquiz.test')
    saveDuelAuth('ABC123', { token: 'tok', role: 'host', name: 'Ali' })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  async function mountRoom(s: object) {
    api.getDuel.mockResolvedValue(s)
    const router = makeRouter()
    const w = mount(DuelRoomView, { props: { code: 'ABC123' }, global: { plugins: [i18n, router] } })
    await vi.advanceTimersByTimeAsync(0)
    await flushPromises()
    return { w, router }
  }

  it('rakip beklerken kodu ve davet bağlantılarını gösterir', async () => {
    const { w } = await mountRoom(state({ status: 'waiting', phase: 'waiting', question: null, remaining_ms: null }))
    expect(w.text()).toContain('Rakip bekleniyor')
    expect(w.find('[data-testid="code"]').text()).toBe('ABC123')
    const wa = decodeURIComponent(w.findAll('a')[0].attributes('href')!)
    expect(wa).toContain('https://diniquiz.test/duello/ABC123')
    expect(wa).toContain('ABC123')
  })

  it('geri sayımı yukarı yuvarlayarak gösterir', async () => {
    const { w } = await mountRoom(state({ phase: 'countdown', question: null, starts_in_ms: 3200 }))
    expect(w.find('[data-testid="countdown"]').text()).toBe('4')
    expect(w.text()).toContain('Ali')
    expect(w.text()).toContain('Veli')
  })

  it('soru aşamasında skor tablosunu, soruyu ve 4 şıkkı gösterir', async () => {
    const { w } = await mountRoom(state())
    expect(w.find('[data-testid="scoreboard"]').text()).toContain('Veli')
    expect(w.text()).toContain('Soru 7')
    expect(w.findAll('button')).toHaveLength(4)
  })

  it('şık seçince cevap gönderilir, şıklar kilitlenir ve rakip beklenir', async () => {
    api.answerDuel.mockResolvedValue({ is_correct: true, correct_choice_id: 72, points: 140, explanation: null })
    const { w } = await mountRoom(state())
    await w.findAll('button')[1].trigger('click')
    await flushPromises()
    expect(api.answerDuel).toHaveBeenCalledWith('ABC123', 'tok', 7, 72)
    expect(w.findAll('button').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    expect(w.text()).toContain('Rakip bekleniyor')
    expect(w.findAll('button')[1].classes()).toContain('bg-success')
  })

  it('ikinci tıklama ikinci cevap göndermez', async () => {
    api.answerDuel.mockResolvedValue({ is_correct: false, correct_choice_id: 72, points: 0, explanation: null })
    const { w } = await mountRoom(state())
    await w.findAll('button')[0].trigger('click')
    await w.findAll('button')[2].trigger('click')
    await flushPromises()
    expect(api.answerDuel).toHaveBeenCalledTimes(1)
  })

  it('rakip cevapladıysa uyarır', async () => {
    const { w } = await mountRoom(state({ opponent: { name: 'Veli', answered: true, correct: 0, points: 0, connected: true } }))
    expect(w.text()).toContain('Rakip cevapladı, sıra sende')
  })

  it('reveal aşamasında doğru şıkkı, iki oyuncunun seçimini ve açıklamayı gösterir', async () => {
    const { w } = await mountRoom(state({
      phase: 'reveal', remaining_ms: null,
      reveal: {
        index: 0, correct_choice_id: 72, explanation: 'Çünkü böyle', my_choice_id: 71, opponent_choice_id: 72,
        my_correct: false, opponent_correct: true, my_points: 0, opponent_points: 140,
      },
    }))
    const reveal = w.find('[data-testid="reveal"]')
    expect(reveal.text()).toContain('A1')
    expect(reveal.text()).toContain('B1')
    expect(reveal.text()).toContain('Çünkü böyle')
    expect(w.findAll('button')[1].classes()).toContain('bg-success')
    expect(w.findAll('button')[0].classes()).toContain('bg-danger')
  })

  it.each([
    ['me', 'Kazandın!'],
    ['opponent', 'rakip kazandı'],
    ['draw', 'Berabere!'],
  ])('bitişte sonucu söyler (%s)', async (winner, text) => {
    const { w } = await mountRoom(state({
      status: 'finished', phase: 'finished', question: null, remaining_ms: null,
      result: { winner, me: { correct: 7, points: 900 }, opponent: { correct: 6, points: 800 } },
    }))
    expect(w.find('[data-testid="outcome"]').text()).toContain(text)
    expect(w.text()).toContain('Yeni yarış')
  })

  it('süresi dolmuş yarışta (sonuç yok) kazanan göstermez, süre doldu der', async () => {
    const { w } = await mountRoom(state({
      status: 'expired', phase: 'finished', question: null, remaining_ms: null, result: null,
    }))
    expect(w.find('[data-testid="expired"]').text()).toContain('süresi dolmuş')
    expect(w.find('[data-testid="outcome"]').exists()).toBe(false)
  })

  it('not_active hatasında durumu yeniler (geri sayımda/bitmişte cevap)', async () => {
    api.answerDuel.mockRejectedValue(httpError(409, 'not_active'))
    const { w } = await mountRoom(state())
    const before = api.getDuel.mock.calls.length
    await w.findAll('button')[0].trigger('click')
    await flushPromises()
    await vi.advanceTimersByTimeAsync(0)
    expect(api.getDuel.mock.calls.length).toBeGreaterThan(before)
    expect(w.text()).not.toContain('Cevap gönderilemedi')
  })

  it('sunucu 404 dönerse bulunamadı mesajı gösterir', async () => {
    api.getDuel.mockRejectedValue(httpError(404))
    const w = mount(DuelRoomView, { props: { code: 'ABC123' }, global: { plugins: [i18n, makeRouter()] } })
    await vi.advanceTimersByTimeAsync(0)
    await flushPromises()
    expect(w.text()).toContain('Yarış bulunamadı')
  })
})

describe('DuelRoomView: katılma', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
    setLocale('tr')
  })
  afterEach(() => vi.useRealTimers())

  async function mountJoin() {
    const w = mount(DuelRoomView, { props: { code: 'abc123' }, global: { plugins: [i18n, makeRouter()] } })
    await flushPromises()
    return w
  }

  it('belirteç yoksa isim formu gösterir ve yoklamaz', async () => {
    const w = await mountJoin()
    expect(w.find('form').exists()).toBe(true)
    expect(w.find('[data-testid="code"]').text()).toBe('ABC123')
    expect(api.getDuel).not.toHaveBeenCalled()
  })

  it('geçersiz isim reddedilir', async () => {
    const w = await mountJoin()
    await w.find('input').setValue('A')
    await w.find('form').trigger('submit')
    expect(api.joinDuel).not.toHaveBeenCalled()
    expect(w.text()).toContain('en az 2 karakter')
  })

  it('katılınca belirteci saklar ve yoklamaya başlar', async () => {
    api.joinDuel.mockResolvedValue({ code: 'ABC123', role: 'guest', token: 'gtok', status: 'active' })
    api.getDuel.mockResolvedValue(state({ phase: 'countdown', question: null, starts_in_ms: 4000 }))
    const w = await mountJoin()
    await w.find('input').setValue('Veli')
    await w.find('form').trigger('submit')
    await vi.advanceTimersByTimeAsync(0)
    await flushPromises()
    expect(api.joinDuel).toHaveBeenCalledWith('ABC123', 'Veli', 'tr')
    expect(loadDuelAuth('ABC123')?.token).toBe('gtok')
    expect(api.getDuel).toHaveBeenCalledWith('ABC123', 'gtok')
  })

  it.each([
    ['duel_full', 'Bu yarış dolu'],
    ['duel_not_found', 'Yarış bulunamadı'],
    ['duel_expired', 'süresi dolmuş'],
    ['same_player', 'Kendi yarışına katılamazsın'],
  ])('katılma hatası %s anlaşılır gösterilir', async (apiCode, text) => {
    api.joinDuel.mockRejectedValue(httpError(409, apiCode))
    const w = await mountJoin()
    await w.find('input').setValue('Veli')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.text()).toContain(text)
  })
})

describe('DuelLobbyView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setLocale('tr')
    api.getCategories.mockResolvedValue([
      { id: 1, slug: 'kuran', name: "Kur'an", color: '#22B573', question_count: 20 },
      { id: 2, slug: 'siyer', name: 'Siyer', color: '#FF8A3D', question_count: 20 },
    ])
    api.getLevels.mockResolvedValue({
      category: 'kuran', level_count: 10, questions_per_level: 10,
      levels: Array.from({ length: 10 }, (_, i) => ({
        level: i + 1, status: i === 0 ? 'unlocked' : 'locked', question_count: i < 2 ? 10 : 0,
      })),
    })
  })

  async function mountLobby() {
    const router = makeRouter()
    const w = mount(DuelLobbyView, { global: { plugins: [i18n, router] } })
    await flushPromises()
    return { w, router }
  }

  it('kategori seçince seviyeleri getirir; soru olmayan seviye seçilemez', async () => {
    const { w } = await mountLobby()
    await w.find('[data-category="kuran"]').trigger('click')
    await flushPromises()
    const tiles = w.findAll('[data-level]')
    expect(tiles).toHaveLength(10)
    expect(tiles[0].attributes('disabled')).toBeUndefined()
    expect(tiles[2].attributes('disabled')).toBeDefined()
  })

  it('yarışta kilitli seviye de seçilebilir (kilit yalnız tek kişilik ilerleme içindir)', async () => {
    const { w } = await mountLobby()
    await w.find('[data-category="kuran"]').trigger('click')
    await flushPromises()
    const second = w.findAll('[data-level]')[1]
    expect(second.attributes('disabled')).toBeUndefined() // status 'locked' ama soru var
  })

  it('isim olmadan oluşturulamaz; isimle oluşturunca odaya gider ve belirteci saklar', async () => {
    api.createDuel.mockResolvedValue({
      code: 'K7M2QX', role: 'host', token: 'htok', status: 'waiting', category: 'kuran', level: 1,
      total_questions: 10, time_limit_seconds: 30, expires_in_seconds: 1800,
    })
    const { w, router } = await mountLobby()
    await w.find('[data-category="kuran"]').trigger('click')
    await flushPromises()
    const createBtn = () => w.findAll('button').find((b) => b.text() === 'Yarış oluştur')!
    expect(createBtn().attributes('disabled')).toBeDefined()
    await w.find('#duel-name').setValue('Ali')
    expect(createBtn().attributes('disabled')).toBeUndefined()
    await createBtn().trigger('click')
    await flushPromises()
    expect(api.createDuel).toHaveBeenCalledWith({ category: 'kuran', level: 1, language: 'tr', player_name: 'Ali' })
    expect(loadDuelAuth('K7M2QX')).toEqual({ token: 'htok', role: 'host', name: 'Ali' })
    expect(router.currentRoute.value.fullPath).toBe('/duello/K7M2QX')
  })

  it('sunucu level_empty dönerse anlaşılır mesaj gösterir', async () => {
    api.createDuel.mockRejectedValue(httpError(409, 'level_empty'))
    const { w } = await mountLobby()
    await w.find('[data-category="kuran"]').trigger('click')
    await flushPromises()
    await w.find('#duel-name').setValue('Ali')
    await w.findAll('button').find((b) => b.text() === 'Yarış oluştur')!.trigger('click')
    await flushPromises()
    expect(w.text()).toContain('henüz soru yok')
  })

  it('kodla katıl: kodu düzeltip odaya gider', async () => {
    const { w, router } = await mountLobby()
    await w.find('input[maxlength="8"]').setValue('ab-c12 3x')
    await w.findAll('button').find((b) => b.text() === 'Katıl')!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/duello/ABC123')
  })
})
