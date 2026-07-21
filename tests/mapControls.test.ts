import { describe, expect, it } from 'vitest'
import { clampView, panView, zoomView } from '../src/map/mapControls'

describe('map viewport controls', () => {
  it('prevents the map from being dragged off-screen at minimum zoom', () => {
    expect(panView({ scale: 1, x: 0, y: 0 }, 50_000, -50_000)).toEqual({ scale: 1, x: 0, y: 0 })
  })

  it('clamps panning to the scaled map bounds', () => {
    expect(clampView({ scale: 2, x: 200, y: -900 })).toEqual({ scale: 2, x: 0, y: -500 })
    expect(clampView({ scale: 2, x: -2_000, y: 100 })).toEqual({ scale: 2, x: -1000, y: 0 })
  })

  it('keeps the viewport centered while zooming and returns safely to 1x', () => {
    const zoomed = zoomView({ scale: 1, x: 0, y: 0 }, 1)
    expect(zoomed).toEqual({ scale: 1.4, x: -200, y: -100 })

    let view = zoomed
    for (let index = 0; index < 20; index += 1) view = zoomView(view, -1)
    expect(view).toEqual({ scale: 1, x: 0, y: 0 })
  })
})
