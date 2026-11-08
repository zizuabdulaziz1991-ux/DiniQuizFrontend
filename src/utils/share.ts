/** Paylaşılacak sitenin adresi (kendi alan adın olursa VITE_SITE_URL'i değiştirmen yeterli). */
export function siteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined
  const base = configured || (typeof window !== 'undefined' ? window.location.origin : '')
  return base.replace(/\/+$/, '')
}

export function whatsappUrl(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
}

export function telegramUrl(text: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
}
