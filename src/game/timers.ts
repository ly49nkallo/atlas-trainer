import type { RegionFilter } from '../data/countries'

export const timerSeconds: Record<RegionFilter, number> = {
  World: 15 * 60,
  Africa: 10 * 60,
  Asia: 8 * 60,
  Europe: 8 * 60,
  'North America': 8 * 60,
  'South America': 4 * 60,
  Oceania: 4 * 60,
  'Central America': 3 * 60,
  Caribbean: 4 * 60,
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds)
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}
