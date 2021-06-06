import regl from 'regl'
import { StringAccessor } from '@/graph/config'
import { getValue, getRgbaColor } from '@/graph/helper'
import { InputNode, Node } from '@/graph/types'
import { defaultNodeColor } from '@/graph/variables'

export function createColorBuffer <N extends InputNode> (
  nodes: Node<N>[],
  reglInstance: regl.Regl,
  textureSize: number,
  colorAccessor: StringAccessor<Node<N>>
): regl.Framebuffer2D {
  const initialState = new Float32Array(textureSize * textureSize * 4)

  for (const [i, node] of nodes.entries()) {
    const c = getValue(node, colorAccessor) as string
    const rgba = getRgbaColor(c ?? defaultNodeColor)
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
