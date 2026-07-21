import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { geoCentroid, geoEqualEarth, geoPath } from 'd3-geo'
import type { Continent, Country, RegionFilter } from '../data/countries'
import { countriesByCode } from '../data/countries'
import { worldFeatures } from './geography'
import { centeredView, clampView, mapHeight, mapWidth, panView, zoomView } from './mapControls'

interface WorldMapProps {
  activeCountries: Country[]
  guessedCodes: Set<string>
  revealedCodes?: Set<string>
  region: RegionFilter
}

const projection = geoEqualEarth().fitExtent([[12, 12], [988, 488]], { type: 'Sphere' })
const pathGenerator = geoPath(projection)

const continents = new Set<Continent>(['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'])

// Screen-pixel offsets for labels whose geographic centers are too close together.
const labelOffsets: Record<string, [number, number]> = {
  PS: [-5, 7],
  IL: [-6, -12],
  JO: [8, 5],
  AM: [-4, -6],
  AZ: [5, 6],
  BH: [0, -6],
  HT: [-6, -5],
  DO: [7, 5],
  KN: [0, -5],
  AG: [0, 5],
  IE: [0, 2],
  LI: [-5, -5],
  SM: [0, 4],
  RS: [0, -6],
  AL: [0, 3],
  XK: [0, 7],
  GA: [-7, -5],
  CG: [9, 5],
  LS: [0, 5],
  ST: [0, 3],
}

function initialView(region: RegionFilter, activeCountries: Country[]) {
  if (!continents.has(region as Continent)) return { scale: 1, x: 0, y: 0 }
  const points = activeCountries
    .map((country) => projection([country.coordinates[1], country.coordinates[0]]))
    .filter((point): point is [number, number] => Boolean(point))
  if (!points.length) return { scale: 1, x: 0, y: 0 }
  const center: [number, number] = [
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length,
  ]
  return centeredView(1.7, center)
}

export function WorldMap({ activeCountries, guessedCodes, revealedCodes = new Set(), region }: WorldMapProps) {
  const [view, setView] = useState(() => initialView(region, activeCountries))
  const mapElement = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null)
  const activeIds = new Map(activeCountries.map((country) => [country.numericId, country]))

  useEffect(() => setView(initialView(region, activeCountries)), [region, activeCountries])

  function zoom(direction: number) {
    setView((current) => zoomView(current, direction))
  }

  useEffect(() => {
    const element = mapElement.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      setView((current) => zoomView(current, event.deltaY < 0 ? 1 : -1))
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [])

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (view.scale === 1 || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, originX: view.x, originY: view.y }
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!drag.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const svgUnitsPerPixelX = mapWidth / bounds.width
    const svgUnitsPerPixelY = mapHeight / bounds.height
    setView(clampView({
      scale: view.scale,
      x: drag.current.originX + (event.clientX - drag.current.x) * svgUnitsPerPixelX,
      y: drag.current.originY + (event.clientY - drag.current.y) * svgUnitsPerPixelY,
    }))
  }

  function stopDragging() {
    drag.current = null
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    const movement: Record<string, [number, number]> = {
      ArrowLeft: [40, 0],
      ArrowRight: [-40, 0],
      ArrowUp: [0, 40],
      ArrowDown: [0, -40],
    }
    if (event.key === '+' || event.key === '=') zoom(1)
    else if (event.key === '-') zoom(-1)
    else if (event.key === '0') setView({ scale: 1, x: 0, y: 0 })
    else if (movement[event.key]) setView((current) => panView(current, ...movement[event.key]))
    else return
    event.preventDefault()
  }

  return (
    <div className="relative overflow-hidden border border-black bg-white">
      <svg
        ref={mapElement}
        viewBox="0 0 1000 500"
        className="h-auto w-full cursor-grab touch-none active:cursor-grabbing"
        role="img"
        aria-label="Interactive world map showing quiz progress. Use plus and minus to zoom, arrow keys to pan, and zero to reset."
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onLostPointerCapture={stopDragging}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {worldFeatures.map((mapFeature) => {
            const id = String(mapFeature.id).padStart(3, '0')
            const country = activeIds.get(id)
            const guessed = country ? guessedCodes.has(country.code) : false
            const revealed = country ? revealedCodes.has(country.code) : false
            return <path key={id} d={pathGenerator(mapFeature) ?? ''} className={guessed ? 'fill-green-300 stroke-black' : revealed ? 'fill-red-300 stroke-black' : country ? 'fill-gray-300 stroke-black' : 'fill-gray-100 stroke-gray-500'} strokeWidth={0.7 / view.scale} />
          })}
          {activeCountries.filter((country) => !worldFeatures.some((item) => String(item.id).padStart(3, '0') === country.numericId)).map((country) => {
            const point = projection([country.coordinates[1], country.coordinates[0]])
            if (!point) return null
            return <circle key={country.code} cx={point[0]} cy={point[1]} r={4 / view.scale} className={guessedCodes.has(country.code) ? 'fill-green-300' : revealedCodes.has(country.code) ? 'fill-red-300' : 'fill-gray-600'}><title>{country.name}</title></circle>
          })}
          {activeCountries.filter((country) => revealedCodes.has(country.code)).map((country) => {
            const feature = worldFeatures.find((item) => String(item.id).padStart(3, '0') === country.numericId)
            const coordinates = feature ? geoCentroid(feature) : [country.coordinates[1], country.coordinates[0]]
            const point = projection(coordinates as [number, number])
            if (!point) return null
            const [offsetX, offsetY] = labelOffsets[country.code] ?? [0, 0]
            return <text key={`label-${country.code}`} x={point[0] + offsetX / view.scale} y={point[1] + offsetY / view.scale} textAnchor="middle" dominantBaseline="central" fontSize={12 / view.scale} fontWeight="700" stroke="white" strokeWidth={3 / view.scale} paintOrder="stroke" className="pointer-events-none fill-black">{country.name}</text>
          })}
        </g>
      </svg>
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button type="button" className="map-control" onClick={() => zoom(-1)} aria-label="Zoom out">−</button>
        <button type="button" className="map-control" onClick={() => setView({ scale: 1, x: 0, y: 0 })}>Reset</button>
        <button type="button" className="map-control" onClick={() => zoom(1)} aria-label="Zoom in">+</button>
      </div>
      <span className="sr-only">{[...guessedCodes].map((code) => countriesByCode.get(code)?.name).filter(Boolean).join(', ')} guessed</span>
    </div>
  )
}
