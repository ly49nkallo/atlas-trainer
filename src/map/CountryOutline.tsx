import { geoMercator, geoPath } from 'd3-geo'
import type { Country } from '../data/countries'
import { featuresById } from './geography'

interface CountryOutlineProps {
  country: Country
  className?: string
}

export function CountryOutline({ country, className = '' }: CountryOutlineProps) {
  const countryFeature = featuresById.get(country.numericId)
  if (!countryFeature) return <span className={`grid place-items-center text-2xl font-black ${className}`}>{country.code}</span>
  const projection = geoMercator().fitExtent([[8, 8], [152, 92]], countryFeature)
  const path = geoPath(projection)(countryFeature) ?? ''
  return (
    <svg className={className} viewBox="0 0 160 100" role="img" aria-label={`${country.name} outline`}>
      <path d={path} className="fill-current" />
    </svg>
  )
}
