export interface MapView {
  scale: number
  x: number
  y: number
}

export const mapWidth = 1000
export const mapHeight = 500
export const minScale = 1
export const maxScale = 5

export function clampView(view: MapView): MapView {
  const scale = Math.min(maxScale, Math.max(minScale, view.scale))
  return {
    scale,
    x: Math.min(0, Math.max(mapWidth * (1 - scale), view.x)),
    y: Math.min(0, Math.max(mapHeight * (1 - scale), view.y)),
  }
}

export function panView(view: MapView, deltaX: number, deltaY: number): MapView {
  return clampView({ ...view, x: view.x + deltaX, y: view.y + deltaY })
}

export function zoomView(view: MapView, direction: number): MapView {
  const scale = Math.min(maxScale, Math.max(minScale, view.scale + direction * 0.4))
  if (scale === view.scale) return clampView(view)
  const ratio = scale / view.scale
  return clampView({
    scale,
    x: mapWidth / 2 - (mapWidth / 2 - view.x) * ratio,
    y: mapHeight / 2 - (mapHeight / 2 - view.y) * ratio,
  })
}
