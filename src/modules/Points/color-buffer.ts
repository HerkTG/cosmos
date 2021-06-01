import regl from 'regl'
import { StringAccessor } from '@/graph/config'
import { getValue, getRgbaColor } from '@/graph/helper'
import { Node } from '@/graph/types'
import { defaultNodeColor } from '@/graph/variables'

export function createColorBuffer <N extends Node> (
  nodes: N[],
  reglInstance: regl.Regl,
  textureSize: number,
  colorAccessor: StringAccessor<N>
): regl.Framebuffer2D {
  const initialState = new Float32Array(textureSize * textureSize * 4)

  for (const [i, node] of nodes.entries()) {
    const rgba = getRgbaColor(getValue(node, colorAccessor) ?? defaultNodeColor)
    initialState[i * 4 + 0] = rgba[0]
    initialState[i * 4 + 1] = rgba[1]
    initialState[i * 4 + 2] = rgba[2]
  }

  const initialTexture = reglInstance.texture({
    data: initialState,
    width: textureSize,
    height: textureSize,
    type: 'float',
  })

  return reglInstance.framebuffer({
    color: initialTexture,
    depth: false,
    stencil: false,
  })
}
