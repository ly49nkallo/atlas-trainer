import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import worldTopology from 'world-atlas/countries-110m.json'
import outlineTopology from 'world-atlas/countries-50m.json'

function topologyFeatures(topology: unknown): Feature<Geometry>[] {
  const value = topology as { objects: { countries: unknown } }
  const collection = feature(value as never, value.objects.countries as never) as unknown as FeatureCollection
  return collection.features as Feature<Geometry>[]
}

export const worldFeatures = topologyFeatures(worldTopology)
export const featuresById = new Map(topologyFeatures(outlineTopology).map((item) => [String(item.id).padStart(3, '0'), item]))
