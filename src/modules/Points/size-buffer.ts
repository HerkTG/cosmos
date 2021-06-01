import regl from 'regl'
import { NumericAccessor } from '@/graph/config'
import { getValue } from '@/graph/helper'
import { Node } from '@/graph/types'
import { defaultNodeSize } from '@/graph/variables'

export function createSizeBuffer <N extends Node> (
  nodes: N[],
  reglInstance: regl.Regl,
  pointTextureSize: number,
  sizeAccessor: NumericAccessor<N>
): regl.Framebuffer2D {
  const numParticles = nodes.length
  const initialState = new Float32Array(pointTextureSize * pointTextureSize * 4)

  for (let i = 0; i < numParticles; ++i) {
    const size = getValue(nodes[i], sizeAccessor)
    initialState[i * 4] = size ?? defaultNodeSize
  }

  const initialTexture = reglInstance.texture({
    data: initialState,
    width: pointTextureSize,
    height: pointTextureSize,
    type: 'float',
  })

  return reglInstance.framebuffer({
    color: initialTexture,
    depth: false,
    stencil: false,
  })
}
