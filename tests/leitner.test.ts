import { describe, expect, it } from 'vitest'
import { isDue, recordReview } from '../src/game/leitner'

describe('Leitner scheduling', () => {
  const now = new Date('2026-07-20T12:00:00.000Z')

  it('advances through the balanced five-box intervals', () => {
    const first = recordReview(undefined, true, now)
    expect(first.box).toBe(1)
    expect(first.nextReview).toBe('2026-07-21T12:00:00.000Z')

    const second = recordReview(first, true, now)
    expect(second.box).toBe(2)
    expect(second.nextReview).toBe('2026-07-23T12:00:00.000Z')
  })

  it('returns mistakes to box one and records the confusion', () => {
    const learned = { ...recordReview(undefined, true, now), box: 4 as const }
    const result = recordReview(learned, false, now, 'TD')
    expect(result.box).toBe(1)
    expect(result.mistakes).toBe(1)
    expect(result.confusedWith.TD).toBe(1)
  })

  it('identifies due associations', () => {
    const review = recordReview(undefined, true, now)
    expect(isDue(review, new Date('2026-07-21T12:00:00.000Z'))).toBe(true)
  })
})
