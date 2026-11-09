import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { AxiosResponse } from 'axios'
import { http } from '@/api/client'
import { getPlayerId } from '@/utils/playerId'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('oyuncu kimliği', () => {
  beforeEach(() => localStorage.clear())

  it('ilk açılışta UUID v4 üretir ve saklar', () => {
    const id = getPlayerId()
    expect(id).toMatch(UUID_V4)
    expect(localStorage.getItem('diniquiz_player_id')).toBe(id)
  })

  it('sonraki çağrılarda aynı kimliği döndürür', () => {
    expect(getPlayerId()).toBe(getPlayerId())
  })

  it('kayıtlı geçersiz değeri yenisiyle değiştirir', () => {
    localStorage.setItem('diniquiz_player_id', 'bozuk-deger')
    const id = getPlayerId()
    expect(id).toMatch(UUID_V4)
    expect(id).not.toBe('bozuk-deger')
  })
})

describe('X-Player-Id başlığı', () => {
  const original = http.defaults.adapter
  afterEach(() => {
    http.defaults.adapter = original
  })

  it('her isteğe eklenir', async () => {
    let seen: string | null = null
    http.defaults.adapter = async (config) => {
      seen = String(config.headers.get('X-Player-Id'))
      return { data: {}, status: 200, statusText: '', headers: {}, config } as AxiosResponse
    }
    await http.get('/categories/')
    expect(seen).toBe(getPlayerId())
  })
})
