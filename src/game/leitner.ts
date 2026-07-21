export type TargetType = 'name' | 'flag' | 'outline'

export interface ReviewState {
  box: 1 | 2 | 3 | 4 | 5
  lastReviewed: string
  nextReview: string
  correct: number
  mistakes: number
  confusedWith: Record<string, number>
}

const intervalDays = [1, 3, 7, 14, 30] as const

export function reviewKey(countryCode: string, target: TargetType): string {
  return `${countryCode}:${target}`
}

export function recordReview(previous: ReviewState | undefined, correct: boolean, now: Date, confusedWith?: string): ReviewState {
  const box = correct ? Math.min(5, (previous?.box ?? 0) + 1) as ReviewState['box'] : 1
  const nextReview = new Date(now)
  nextReview.setUTCDate(nextReview.getUTCDate() + intervalDays[box - 1])
  const confusions = { ...(previous?.confusedWith ?? {}) }
  if (!correct && confusedWith) confusions[confusedWith] = (confusions[confusedWith] ?? 0) + 1
  return {
    box,
    lastReviewed: now.toISOString(),
    nextReview: nextReview.toISOString(),
    correct: (previous?.correct ?? 0) + Number(correct),
    mistakes: (previous?.mistakes ?? 0) + Number(!correct),
    confusedWith: confusions,
  }
}

export function isDue(review: ReviewState | undefined, now: Date): boolean {
  return !review || new Date(review.nextReview).getTime() <= now.getTime()
}
