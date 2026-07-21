import type { RegionFilter } from '../data/countries'
import type { ReviewState } from '../game/leitner'

export interface BestScore {
  guessed: number
  total: number
  secondsRemaining: number
  completedAt: string
}

export interface ProgressData {
  version: 1
  reviews: Record<string, ReviewState>
  bestScores: Partial<Record<string, BestScore>>
  settings: {
    defaultRegion: RegionFilter
  }
}

const storageKey = 'atlas-trainer-progress'

export const emptyProgress: ProgressData = {
  version: 1,
  reviews: {},
  bestScores: {},
  settings: { defaultRegion: 'World' },
}

export function isProgressData(value: unknown): value is ProgressData {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProgressData>
  return candidate.version === 1 && typeof candidate.reviews === 'object' && candidate.reviews !== null && typeof candidate.bestScores === 'object' && candidate.bestScores !== null && typeof candidate.settings === 'object' && candidate.settings !== null
}

export function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return structuredClone(emptyProgress)
    const parsed: unknown = JSON.parse(raw)
    return isProgressData(parsed) ? parsed : structuredClone(emptyProgress)
  } catch {
    return structuredClone(emptyProgress)
  }
}

export function saveProgress(progress: ProgressData): void {
  localStorage.setItem(storageKey, JSON.stringify(progress))
}

export function exportProgress(progress: ProgressData): void {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `atlas-trainer-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function parseProgressFile(file: File): Promise<ProgressData> {
  const parsed: unknown = JSON.parse(await file.text())
  if (!isProgressData(parsed)) throw new Error('This is not a valid Atlas Trainer progress file.')
  return parsed
}

export function mergeProgress(current: ProgressData, imported: ProgressData): ProgressData {
  return {
    ...current,
    reviews: { ...current.reviews, ...imported.reviews },
    bestScores: { ...current.bestScores, ...imported.bestScores },
  }
}

export function resetProgress(): ProgressData {
  localStorage.removeItem(storageKey)
  return structuredClone(emptyProgress)
}
