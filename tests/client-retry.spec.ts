import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import { http, wakeConfig } from '@/api/client'
import { slowRequests } from '@/composables/useServerStatus'

type Step = number | 'network'
let calls = 0
const originalAdapter = http.defaults.adapter
const originalDelay = wakeConfig.delayMs

function useAdapter(plan: Step[]) {
  calls = 0
  http.defaults.adapter = async (config) => {
    const step = plan[calls++] ?? 200
    if (step === 'network') throw new AxiosError('Network Error', 'ERR_NETWORK', config)
    const response = { data: { ok: true }, status: step, statusText: '', headers: {}, config } as AxiosResponse
    if (step >= 400) throw new AxiosError('fail', 'ERR_BAD_RESPONSE', config, null, response)
    return response
  }
}

describe('sunucu uyanırken yeniden deneme', () => {
  beforeEach(() => {
    wakeConfig.delayMs = 0
    slowRequests.value = 0
  })
  afterEach(() => {
    http.defaults.adapter = originalAdapter
    wakeConfig.delayMs = originalDelay
  })

  it('503 yanıtlarından sonra başarılı olunca sonucu döndürür', async () => {
    useAdapter([503, 503, 200])
    const res = await http.get('/ping')
    expect(res.status).toBe(200)
    expect(calls).toBe(3)
    expect(slowRequests.value).toBe(0)
  })

  it('GET isteğinde ağ hatasını tekrar dener', async () => {
    useAdapter(['network', 'network', 200])
    await expect(http.get('/ping')).resolves.toMatchObject({ status: 200 })
    expect(calls).toBe(3)
    expect(slowRequests.value).toBe(0)
  })

  it('en fazla belirlenen sayıda dener ve pes eder', async () => {
    useAdapter([503, 503, 503, 503, 503, 503])
    await expect(http.get('/ping')).rejects.toBeTruthy()
    expect(calls).toBe(1 + wakeConfig.retries)
    expect(slowRequests.value).toBe(0)
  })

  it('400 gibi istemci hatalarını tekrar denemez', async () => {
    useAdapter([400, 200])
    await expect(http.get('/ping')).rejects.toBeTruthy()
    expect(calls).toBe(1)
  })

  it('POST isteğinde yanıtsız ağ hatasını tekrar denemez (çift kayıt olmasın)', async () => {
    useAdapter(['network', 200])
    await expect(http.post('/ping', {})).rejects.toBeTruthy()
    expect(calls).toBe(1)
  })

  it('POST isteği 503 alırsa (istek sunucuya ulaşmamıştır) tekrar dener', async () => {
    useAdapter([503, 200])
    await expect(http.post('/ping', {})).resolves.toMatchObject({ status: 200 })
    expect(calls).toBe(2)
  })
})
