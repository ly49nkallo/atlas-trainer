import { describe, expect, it } from 'vitest'
import { countries } from '../src/data/countries'
import { matchCountry, normalizeAnswer } from '../src/game/answerMatcher'

describe('answer matching', () => {
  it('normalizes accents, punctuation, articles, and spacing', () => {
    expect(normalizeAnswer("  The Côte-d’Ivoire  ")).toBe('cote d ivoire')
  })

  it('accepts curated abbreviations and alternatives', () => {
    expect(matchCountry('US', countries)?.code).toBe('US')
    expect(matchCountry('USA', countries)?.code).toBe('US')
    expect(matchCountry('UK', countries)?.code).toBe('GB')
    expect(matchCountry('UAE', countries)?.code).toBe('AE')
    expect(matchCountry('DRC', countries)?.code).toBe('CD')
    expect(matchCountry('CAR', countries)?.code).toBe('CF')
    expect(matchCountry('Ivory Coast', countries)?.code).toBe('CI')
    expect(matchCountry('Malvinas', countries)?.code).toBe('FK')
    expect(matchCountry('Bosnia Herzegovina', countries)?.code).toBe('BA')
  })

  it('requires Herzegovina in answers for Bosnia and Herzegovina', () => {
    expect(matchCountry('Bosnia', countries)).toBeNull()
    expect(matchCountry('Bosnia and Herzegovina', countries)?.code).toBe('BA')
  })

  it('rejects uncurated ISO and dataset abbreviations', () => {
    expect(matchCountry('DE', countries)).toBeNull()
    expect(matchCountry('DEU', countries)).toBeNull()
    expect(matchCountry('CG', countries)).toBeNull()
    expect(matchCountry('COG', countries)).toBeNull()
  })

  it('accepts a unique conservative transposition', () => {
    expect(matchCountry('Untied States', countries)?.code).toBe('US')
  })

  it('waits for the full name length during live typing', () => {
    expect(matchCountry('Polan', countries, { requireFullLength: true })).toBeNull()
    expect(matchCountry('Polnad', countries, { requireFullLength: true })?.code).toBe('PL')
    expect(matchCountry('Central African Republi', countries, { requireFullLength: true })).toBeNull()
    expect(matchCountry('Central African Repubilc', countries, { requireFullLength: true })?.code).toBe('CF')
    expect(matchCountry('Bosnia and Herzegovin', countries, { requireFullLength: true })).toBeNull()
    expect(matchCountry('Bosnia and Herzegovian', countries, { requireFullLength: true })?.code).toBe('BA')
  })

  it('allows a missing-letter typo when explicitly submitted', () => {
    expect(matchCountry('Polad', countries, { requireFullLength: true })).toBeNull()
    expect(matchCountry('Polad', countries)?.code).toBe('PL')
    expect(matchCountry('United Arab Emirate', countries, { requireFullLength: true })).toBeNull()
    expect(matchCountry('United Arab Emirate', countries)?.code).toBe('AE')
    expect(matchCountry('Central African Repubic', countries, { requireFullLength: true })).toBeNull()
    expect(matchCountry('Central African Repubic', countries)?.code).toBe('CF')
  })

  it('rejects ambiguous near matches', () => {
    expect(matchCountry('Nigera', countries)).toBeNull()
    expect(matchCountry('Korea', countries)).toBeNull()
    expect(matchCountry('Congo', countries)).toBeNull()
  })
})
