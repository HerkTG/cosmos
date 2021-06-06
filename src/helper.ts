import { color as d3Color } from 'd3-color'
import _isFunction from 'lodash/isFunction'
import regl from 'regl'
import { NumericAccessor, StringAccessor } from './config'

export function getValue<Datum> (
  d: Datum,
  accessor: NumericAccessor<Datum> | StringAccessor<Datum>
): any {
  if (_isFunction(accessor)) return accessor(d)
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
