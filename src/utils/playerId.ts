const KEY = 'diniquiz_player_id'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

let memoryId: string | null = null

function generate(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Eski WebView'lar için yedek: v4 UUID
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const h = [...bytes].map((b) => b.toString(16).padStart(2, '0'))
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h
    .slice(8, 10)
    .join('')}-${h.slice(10).join('')}`
}

/**
 * Hesap yok; ilerleme (açılan seviyeler) bu rastgele kimlikle sunucuda tutulur.
 * İlk açılışta üretilip localStorage'a yazılır. Depolama kapalıysa oturum boyunca bellekte kalır.
 */
export function getPlayerId(): string {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && UUID_RE.test(saved)) return saved
    const id = generate()
    localStorage.setItem(KEY, id)
    return id
  } catch {
    memoryId ??= generate()
    return memoryId
  }
}
