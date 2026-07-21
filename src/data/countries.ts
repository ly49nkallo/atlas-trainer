import sourceCountries from 'world-countries'

export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania'
export type RegionFilter = Continent | 'Central America' | 'Caribbean' | 'World'

export interface Country {
  code: string
  numericId: string
  name: string
  officialName: string
  continent: Continent
  subregion: string
  aliases: string[]
  flag: string
  coordinates: [number, number]
  borders: string[]
}

const includedNonMembers = new Set(['PS', 'VA', 'XK', 'TW', 'CK', 'FK'])
const centralAmerica = new Set(['BZ', 'CR', 'GT', 'HN', 'NI', 'PA', 'SV'])
const aliases: Record<string, string[]> = {
  AE: ['UAE', 'Emirates'],
  BA: ['Bosnia Herzegovina'],
  BN: ['Brunei Darussalam'],
  BO: ['Bolivia'],
  CF: ['CAR'],
  CD: ['DRC', 'DR Congo', 'Democratic Republic of Congo', 'Congo Kinshasa'],
  CG: ['Republic of Congo', 'Congo Brazzaville'],
  CI: ['Ivory Coast', "Cote d'Ivoire"],
  CV: ['Cape Verde'],
  CZ: ['Czech Republic'],
  FK: ['Falklands', 'Islas Malvinas', 'Malvinas'],
  FM: ['Micronesia', 'Federated States of Micronesia'],
  GB: ['UK', 'United Kingdom', 'Britain', 'Great Britain'],
  KR: ['South Korea', 'Republic of Korea'],
  KP: ['North Korea', 'DPRK'],
  LA: ['Laos'],
  MD: ['Moldova'],
  MK: ['Macedonia'],
  MM: ['Burma'],
  PS: ['State of Palestine', 'Palestinian Territories'],
  RU: ['Russian Federation'],
  SZ: ['Swaziland'],
  TL: ['East Timor'],
  TZ: ['Tanzania'],
  US: ['USA', 'US', 'America', 'United States of America'],
  VA: ['Vatican', 'Holy See'],
  VE: ['Venezuela'],
  VN: ['Vietnam'],
  XK: ['Republic of Kosovo'],
}

function continentFor(region: string, subregion: string, code: string): Continent {
  if (code === 'CY') return 'Europe'
  if (region === 'Americas') return subregion === 'South America' ? 'South America' : 'North America'
  if (region === 'Antarctic') return 'Oceania'
  return region as Continent
}

export const countries: Country[] = sourceCountries
  .filter((country) => country.unMember || includedNonMembers.has(country.cca2))
  .map((country) => ({
    code: country.cca2,
    numericId: country.cca2 === 'XK' ? '383' : country.ccn3,
    name: country.name.common,
    officialName: country.name.official,
    continent: continentFor(country.region, country.subregion, country.cca2),
    subregion: country.subregion,
    aliases: aliases[country.cca2] ?? [],
    flag: country.flag,
    coordinates: country.latlng,
    borders: country.borders,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export const countriesByCode = new Map(countries.map((country) => [country.code, country]))
export const regionFilters: RegionFilter[] = ['World', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Central America', 'Caribbean']

export function countriesInRegion(region: RegionFilter): Country[] {
  if (region === 'World') return countries
  if (region === 'Central America') return countries.filter((country) => centralAmerica.has(country.code))
  if (region === 'Caribbean') return countries.filter((country) => country.subregion === 'Caribbean')
  return countries.filter((country) => country.continent === region)
}
