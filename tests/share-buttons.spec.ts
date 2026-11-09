import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n, setLocale } from '@/i18n'
import ShareButtons from '@/components/ShareButtons.vue'

const mk = () => mount(ShareButtons, { props: { score: 1868 }, global: { plugins: [i18n] } })

describe('ShareButtons', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SITE_URL', 'https://diniquiz.test')
    setLocale('tr')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('WhatsApp ve Telegram bağlantıları puanı ve site adresini içerir', () => {
    const links = mk().findAll('a')
    expect(links).toHaveLength(2)
    const wa = decodeURIComponent(links[0].attributes('href')!)
    expect(wa).toContain('1868')
    expect(wa).toContain('https://diniquiz.test')
    const tg = new URL(links[1].attributes('href')!)
    expect(tg.searchParams.get('url')).toBe('https://diniquiz.test')
    expect(tg.searchParams.get('text')).toContain('1868')
  })

  it('davet varyantı puan yerine davet metnini ve başlığını kullanır', () => {
    const w = mount(ShareButtons, { props: { invite: true }, global: { plugins: [i18n] } })
    expect(w.text()).toContain('Arkadaşını quize davet et')
    const wa = decodeURIComponent(w.findAll('a')[0].attributes('href')!)
    expect(wa).toContain('Hadi DiniQuiz oynayalım')
    expect(wa).toContain('https://diniquiz.test')
    expect(wa).not.toMatch(/\d{3,}/)
  })

  it('dış bağlantılar güvenli açılır', () => {
    for (const a of mk().findAll('a')) {
      expect(a.attributes('target')).toBe('_blank')
      expect(a.attributes('rel')).toContain('noopener')
    }
  })

  it('paylaşım metni seçilen dilde olur', () => {
    setLocale('uz')
    const wa = decodeURIComponent(mk().findAll('a')[0].attributes('href')!)
    expect(wa).toContain('ball to‘pladim')
  })

  it('Web Share API varsa "Paylaş" düğmesi görünür ve çağrılır', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })
    setLocale('tr')
    const w = mount(ShareButtons, { props: { score: 5 }, global: { plugins: [i18n] } })
    const native = w.findAll('button').find((b) => b.text() === 'Paylaş')
    expect(native).toBeTruthy()
    await native!.trigger('click')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://diniquiz.test' }))
    delete (navigator as unknown as Record<string, unknown>).share
  })
})
