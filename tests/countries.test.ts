import { describe, expect, it } from 'vitest'
import { countries, countriesInRegion } from '../src/data/countries'

describe('country scope', () => {
  it('contains the agreed 199 answers', () => {
    expect(countries).toHaveLength(199)
    expect(countries.map(({ code }) => code)).toEqual(expect.arrayContaining(['PS', 'VA', 'XK', 'TW', 'CK', 'FK']))
  })

  it('uses the agreed primary continent assignments', () => {
    expect(countries.find(({ code }) => code === 'RU')?.continent).toBe('Europe')
    expect(countries.find(({ code }) => code === 'CY')?.continent).toBe('Europe')
    expect(countries.find(({ code }) => code === 'FK')?.continent).toBe('South America')
    expect(countries.find(({ code }) => code === 'CK')?.continent).toBe('Oceania')
  })

  it('offers overlapping Central American and Caribbean filters', () => {
    expect(countriesInRegion('Central America')).toHaveLength(7)
    expect(countriesInRegion('Caribbean').every(({ continent }) => continent === 'North America')).toBe(true)
  })
})
