import type { Country } from '../data/countries'
import { isDue, reviewKey, type ReviewState, type TargetType } from './leitner'

export interface MemoryQuestion {
  country: Country
  target: TargetType
  choices: Country[]
}

const targets: TargetType[] = ['name', 'flag', 'outline']

function scoreDistractor(answer: Country, candidate: Country, target: TargetType, review?: ReviewState): number {
  const confusion = review?.confusedWith[candidate.code] ?? 0
  const sameSubregion = answer.subregion === candidate.subregion ? 8 : 0
  const sameContinent = answer.continent === candidate.continent ? 3 : 0
  const sharedBorder = answer.borders.includes(candidate.code) ? 5 : 0
  const flagSimilarity = target === 'flag' && answer.flag.length === candidate.flag.length ? 1 : 0
  return confusion * 20 + sameSubregion + sameContinent + sharedBorder + flagSimilarity + Math.random()
}

export function buildSession(pool: Country[], reviews: Record<string, ReviewState>, now: Date, size = 20): MemoryQuestion[] {
  if (pool.length < 4) return []
  const ranked = [...pool].sort((a, b) => {
    const aDue = targets.some((target) => isDue(reviews[reviewKey(a.code, target)], now))
    const bDue = targets.some((target) => isDue(reviews[reviewKey(b.code, target)], now))
    return Number(bDue) - Number(aDue) || Math.random() - 0.5
  })

  return Array.from({ length: Math.min(size, Math.max(size, ranked.length)) }, (_, index) => {
    const country = ranked[index % ranked.length]
    const target = targets[index % targets.length]
    const review = reviews[reviewKey(country.code, target)]
    const distractors = pool
      .filter((candidate) => candidate.code !== country.code)
      .map((candidate) => ({ candidate, score: scoreDistractor(country, candidate, target, review) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ candidate }) => candidate)
    return { country, target, choices: [country, ...distractors].sort(() => Math.random() - 0.5) }
  })
}

export function reinsertMissedQuestion(queue: MemoryQuestion[], question: MemoryQuestion, currentIndex: number): MemoryQuestion[] {
  const insertionIndex = Math.min(queue.length, currentIndex + 4 + Math.floor(Math.random() * 3))
  const next = [...queue]
  next.splice(insertionIndex, 0, question)
  if (next.length > 20) next.pop()
  return next
}
