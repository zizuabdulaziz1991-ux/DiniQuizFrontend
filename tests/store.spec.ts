import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/quiz', () => ({
  sendAnswer: vi.fn(
    () =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              is_correct: true,
              correct_choice_id: 2,
              points: 120,
              total_score: 120,
              explanation: null,
              is_last: false,
            }),
          10,
        ),
      ),
  ),
}))

import * as api from '@/api/quiz'
import { useQuizStore } from '@/stores/quiz'

function prepared() {
  const s = useQuizStore()
  s.sessionId = 'abc'
  s.current = {
    index: 1,
    total: 20,
    remaining_ms: 15000,
    score: 0,
    question: { id: 57, text: 'q', arabic_text: null, choices: [] },
  }
  return s
}

describe('quiz store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('cevap gönderilirken ikinci gönderimi engeller', async () => {
    const s = prepared()
    const [a, b] = await Promise.all([s.answer(2), s.answer(2)])
    expect(api.sendAnswer).toHaveBeenCalledTimes(1)
    expect(a).not.toBeNull()
    expect(b).toBeNull()
  })

  it('puan sunucu yanıtından gelir', async () => {
    const s = prepared()
    await s.answer(2)
    expect(s.score).toBe(120)
  })

  it('süre dolunca choice_id: null gönderir', async () => {
    const s = prepared()
    await s.answer(null)
    expect(api.sendAnswer).toHaveBeenCalledWith('abc', 57, null)
  })
})
