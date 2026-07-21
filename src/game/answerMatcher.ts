import type { Country } from '../data/countries'

export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bthe\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

interface MatchCountryOptions {
  requireFullLength?: boolean
}

function damerauLevenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1)
      }
    }
  }
  return matrix[a.length][b.length]
}

function namesFor(country: Country): string[] {
  return [country.name, country.officialName, ...country.aliases].map(normalizeAnswer).filter(Boolean)
}

export function matchCountry(input: string, availableCountries: Country[], options: MatchCountryOptions = {}): Country | null {
  const normalized = normalizeAnswer(input)
  if (!normalized) return null

  const exact = availableCountries.filter((country) => namesFor(country).includes(normalized))
  if (exact.length === 1) return exact[0]
  if (exact.length > 1) return null

  const maxDistance = normalized.length >= 10 ? 2 : normalized.length >= 5 ? 1 : 0
  if (maxDistance === 0) return null

  const candidates = availableCountries
    .map((country) => {
      const eligibleNames = namesFor(country).filter((name) => !options.requireFullLength || normalized.length >= name.length)
      return eligibleNames.length > 0
        ? { country, distance: Math.min(...eligibleNames.map((name) => damerauLevenshtein(normalized, name))) }
        : null
    })
    .filter((candidate): candidate is { country: Country; distance: number } => candidate !== null)
    .filter(({ distance }) => distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)

  if (candidates.length === 0) return null
  if (candidates.length > 1 && candidates[0].distance === candidates[1].distance) return null
  return candidates[0].country
}
