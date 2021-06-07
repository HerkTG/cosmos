import regl from 'regl'

export function createHighlightedBuffer (
  reglInstance: regl.Regl,
  pointTextureSize: number,
  linksTextureSize: number,
  indices?: number[],
  linkIndices?: Float32Array,
  pointsWithFirstLinkIndices?: Float32Array
): regl.Framebuffer2D {
  const initialState = new Float32Array(pointTextureSize * pointTextureSize * 4).fill(0)
  if (indices?.length && linkIndices && pointsWithFirstLinkIndices) {
    for (const index of indices) {
      const i = pointsWithFirstLinkIndices[index * 4]
      const j = pointsWithFirstLinkIndices[index * 4 + 1]
      const numLinks = pointsWithFirstLinkIndices[index * 4 + 2]
      if (i !== undefined && j !== undefined && numLinks !== undefined) {
        const firstLinkIndex = j * linksTextureSize + i
        for (let n = 0; n < numLinks; n++) {
          const c = firstLinkIndex + n
          const nodeX = linkIndices[c * 4]
          const nodeY = linkIndices[c * 4 + 1]
          if (nodeX !== undefined && nodeY !== undefined) {
            const nodeId = nodeY * pointTextureSize + nodeX
            initialState[nodeId * 4 + 0] = 1
          }
        }
      }
    }
  }

  const initialTexture = reglInstance.texture({
    data: initialState,
    shape: [pointTextureSize, pointTextureSize, 4],
    type: 'float',
  })

  return reglInstance.framebuffer({
    color: initialTexture,
    depth: false,
    stencil: false,
  })
}
