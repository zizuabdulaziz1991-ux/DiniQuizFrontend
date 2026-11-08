import { describe, it, expect, vi, afterEach } from 'vitest'
import { siteUrl, telegramUrl, whatsappUrl } from '@/utils/share'

describe('paylaşım adresleri', () => {
  afterEach(() => vi.unstubAllEnvs())

  it("WhatsApp metni ve linki URL'ye uygun kodlanır", () => {
    const u = whatsappUrl("DiniQuiz'de 1500 puan yaptım!", 'https://x.test')
    expect(u.startsWith('https://wa.me/?text=')).toBe(true)
    expect(decodeURIComponent(u.split('text=')[1])).toBe("DiniQuiz'de 1500 puan yaptım! https://x.test")
  })

  it('Telegram adresi link ve metni ayrı parametre olarak taşır', () => {
    const u = new URL(telegramUrl('Merhaba & selam', 'https://x.test/a?b=1'))
    expect(u.origin + u.pathname).toBe('https://t.me/share/url')
    expect(u.searchParams.get('url')).toBe('https://x.test/a?b=1')
    expect(u.searchParams.get('text')).toBe('Merhaba & selam')
  })

  it('siteUrl sondaki eğik çizgiyi atar', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://diniquiz.test/')
    expect(siteUrl()).toBe('https://diniquiz.test')
  })

  it('ayar yoksa geçerli sayfanın adresini kullanır', () => {
    vi.stubEnv('VITE_SITE_URL', '')
    expect(siteUrl()).toBe(window.location.origin)
  })
})
