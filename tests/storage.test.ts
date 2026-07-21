import { describe, expect, it } from 'vitest'
import { emptyProgress, isProgressData, mergeProgress } from '../src/storage/progress'

describe('progress data', () => {
  it('validates the versioned shape', () => {
    expect(isProgressData(emptyProgress)).toBe(true)
    expect(isProgressData({ version: 2, reviews: {}, bestScores: {}, settings: {} })).toBe(false)
    expect(isProgressData(null)).toBe(false)
  })

  it('merges imported reviews and scores', () => {
    const imported = {
      ...structuredClone(emptyProgress),
      bestScores: { 'World:timed': { guessed: 10, total: 199, secondsRemaining: 1, completedAt: '2026-07-20T00:00:00Z' } },
    }
    const result = mergeProgress(structuredClone(emptyProgress), imported)
    expect(result.bestScores['World:timed']?.guessed).toBe(10)
  })
})
