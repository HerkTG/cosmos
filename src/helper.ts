import { color as d3Color } from 'd3-color'
import regl from 'regl'
import { NumericAccessor, StringAccessor } from './config'

export function isFunction (value: unknown): value is (...args: unknown[]) => unknown {
  if (value && typeof value === 'function') {
    return true
  }
  return false
}

export function getValue<Datum> (
  d: Datum,
  accessor: NumericAccessor<Datum> | StringAccessor<Datum>
): string | number | null | undefined | unknown {
  if (isFunction(accessor)) return accessor(d)
  else return accessor
}

export function getRgbaColor (value: string): [number, number, number, number] {
  const color = d3Color(value)
  const rgb = color?.rgb()
  return [
    (rgb?.r ?? 0) / 255,
    (rgb?.g ?? 0) / 255,
    (rgb?.b ?? 0) / 255,
    color?.opacity ?? 1,
  ]
}

export function readPixels (reglInstance: regl.Regl, fbo: regl.Framebuffer2D): Float32Array {
  let resultPixels = new Float32Array()
  reglInstance({ framebuffer: fbo })(() => {
    resultPixels = reglInstance.read()
  })

  return resultPixels
}
