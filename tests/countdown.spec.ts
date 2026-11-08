import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useCountdown } from '@/composables/useCountdown'

function setup(onExpire: () => void) {
  let api!: ReturnType<typeof useCountdown>
  mount(
    defineComponent({
      setup() {
        api = useCountdown(onExpire)
        return () => null
      },
    }),
  )
  return api
}

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('remaining_ms değerinden başlar', () => {
    const c = setup(() => {})
    c.start(7500)
    expect(c.remainingMs.value).toBe(7500)
  })

  it("0'a inince olay tetikler", () => {
    const fn = vi.fn()
    const c = setup(fn)
    c.start(1000)
    vi.advanceTimersByTime(1200)
    expect(c.remainingMs.value).toBe(0)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('başlangıçta süre 0 ise hemen tetikler', () => {
    const fn = vi.fn()
    setup(fn).start(0)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
