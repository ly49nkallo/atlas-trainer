import { describe, expect, it } from 'vitest'
import { countries } from '../src/data/countries'
import { buildSession, reinsertMissedQuestion } from '../src/game/memorization'

describe('memorization sessions', () => {
  it('builds twenty four-choice questions across all target types', () => {
    const session = buildSession(countries.slice(0, 30), {}, new Date('2026-07-20T12:00:00Z'))
    expect(session).toHaveLength(20)
    expect(new Set(session.map(({ target }) => target))).toEqual(new Set(['name', 'flag', 'outline']))
    for (const question of session) {
      expect(question.choices).toHaveLength(4)
      expect(new Set(question.choices.map(({ code }) => code)).size).toBe(4)
      expect(question.choices.some(({ code }) => code === question.country.code)).toBe(true)
    }
  })

  it('requeues a mistake after intervening questions', () => {
    const session = buildSession(countries.slice(0, 30), {}, new Date('2026-07-20T12:00:00Z'))
    const next = reinsertMissedQuestion(session, session[0], 0)
    expect(next).toHaveLength(20)
    const repeatedAt = next.findIndex((question, index) => index > 0 && question === session[0])
    expect(repeatedAt).toBeGreaterThanOrEqual(4)
    expect(repeatedAt).toBeLessThanOrEqual(6)
  })
})
