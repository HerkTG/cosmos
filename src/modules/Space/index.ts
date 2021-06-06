import regl from 'regl'
import { CoreModule } from '@/graph/modules/core-module'
import { createIndexesBuffer, createQuadBuffer } from '@/graph/modules/Shared/buffer'
import clearFrag from '@/graph/modules/Shared/clear.frag'
import updateVert from '@/graph/modules/Shared/quad.vert'
import fillSpaceFrag from '@/graph/modules/Space/fill-space.frag'
import fillSpaceVert from '@/graph/modules/Space/fill-space.vert'
import { defaultConfigValues } from '@/graph/variables'
import { InputNode, InputLink } from '@/graph/types'

export class Space<N extends InputNode, L extends InputLink> extends CoreModule<N, L> {
  public spaceFbo: regl.Framebuffer2D | undefined
  private clearCommand: regl.DrawCommand | undefined
  private fillCommand: regl.DrawCommand | undefined

  public create (): void {
    const { reglInstance, config } = this
    const spaceSize = config.spaceSize ?? defaultConfigValues.spaceSize
    this.spaceFbo = reglInstance.framebuffer({
      color: reglInstance.texture({
        data: new Float32Array(spaceSize * spaceSize * 4),
        shape: [spaceSize, spaceSize, 4],
        type: 'float',
      }),
      depth: false,
      stencil: false,
    })
  }

  public initPrograms (): void {
    const { reglInstance, config, store, data, points } = this
    this.clearCommand = reglInstance({
      frag: clearFrag,
      vert: updateVert,
      framebuffer: () => this.spaceFbo as regl.Framebuffer2D,
      primitive: 'triangle strip',
      count: 4,
      attributes: { quad: createQuadBuffer(reglInstance) },
    })

    this.fillCommand = reglInstance({
      frag: fillSpaceFrag,
      vert: fillSpaceVert,
      framebuffer: () => this.spaceFbo as regl.Framebuffer2D,
      primitive: 'points',
      count: () => data.nodes.length,
      attributes: { indexes: createIndexesBuffer(reglInstance, store.pointsTextureSize) },
      uniforms: {
        position: () => points?.previousPositionFbo,
        pointsTextureSize: () => store.pointsTextureSize,
        spaceSize: () => config.spaceSize,
      },
      blend: {
        enable: true,
        func: {
          src: 'one',
          dst: 'one',
        },
        equation: {
          rgb: 'add',
          alpha: 'add',
        },
      },
      depth: { enable: false, mask: false },
      stencil: { enable: false },
    })
  }

  public run (): void {
    this.clearCommand?.()
    this.fillCommand?.()
  }
}
