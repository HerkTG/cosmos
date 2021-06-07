import regl from 'regl'
import { CoreModule } from '@/graph/modules/core-module'
import { ForceLink } from '@/graph/modules/ForceLink'
import { createColorBuffer } from '@/graph/modules/Points/color-buffer'
import drawPointsFrag from '@/graph/modules/Points/draw-points.frag'
import drawPointsVert from '@/graph/modules/Points/draw-points.vert'
import findPointFrag from '@/graph/modules/Points/find-point.frag'
import { createHighlightedBuffer } from '@/graph/modules/Points/highlighted-buffer'
import { createSizeBuffer } from '@/graph/modules/Points/size-buffer'
import updatePositionFrag from '@/graph/modules/Points/update-position.frag'
import { createIndexesBuffer, createQuadBuffer } from '@/graph/modules/Shared/buffer'
import updateVert from '@/graph/modules/Shared/quad.vert'
import { defaultConfigValues } from '@/graph/variables'
import { InputNode, InputLink } from '@/graph/types'

export enum DrawType {
  HIGHLIGHTED = 'highlighted',
  DIMMED = 'dimmed',
  DEFAULT = 'default',
}
export class Points<N extends InputNode, L extends InputLink> extends CoreModule<N, L> {
  public currentPositionFbo: regl.Framebuffer2D | undefined
  public previousPositionFbo: regl.Framebuffer2D | undefined
  public velocityFbo: regl.Framebuffer2D | undefined
  public selectedFbo: regl.Framebuffer2D | undefined
  public highlightedFbo: regl.Framebuffer2D | undefined
  public colorFbo: regl.Framebuffer2D | undefined
  public sizeFbo: regl.Framebuffer2D | undefined
  public clickedId = -1
  private drawCommand: regl.DrawCommand | undefined
  private updatePositionCommand: regl.DrawCommand | undefined
  private findPointCommand: regl.DrawCommand | undefined

  public create (): void {
    const { reglInstance, config, store, data: { nodes } } = this
    const { spaceSize } = config
    const { pointsTextureSize } = store
    const numParticles = nodes.length
    const initialState = new Float32Array(pointsTextureSize * pointsTextureSize * 4)
    for (let i = 0; i < numParticles; ++i) {
      const node = nodes[i]
      initialState[i * 4 + 0] = node?.x ?? (spaceSize ?? defaultConfigValues.spaceSize) * (Math.random() * (0.505 - 0.495) + 0.495)
      initialState[i * 4 + 1] = node?.y ?? (spaceSize ?? defaultConfigValues.spaceSize) * (Math.random() * (0.505 - 0.495) + 0.495)
    }

    // Create position buffer
    this.currentPositionFbo = reglInstance.framebuffer({
      color: reglInstance.texture({
        data: initialState,
        shape: [pointsTextureSize, pointsTextureSize, 4],
        type: 'float',
      }),
      depth: false,
      stencil: false,
    })

    this.previousPositionFbo = reglInstance.framebuffer({
      color: reglInstance.texture({
        data: initialState,
        shape: [pointsTextureSize, pointsTextureSize, 4],
        type: 'float',
      }),
      depth: false,
      stencil: false,
    })

    // Create velocity buffer
    this.velocityFbo = reglInstance.framebuffer({
      color: reglInstance.texture({
        data: new Float32Array(pointsTextureSize * pointsTextureSize * 4).fill(0),
        shape: [pointsTextureSize, pointsTextureSize, 4],
        type: 'float',
      }),
      depth: false,
      stencil: false,
    })

    // Create selected points buffer
    this.selectedFbo = reglInstance.framebuffer({
      color: reglInstance.texture({
        data: initialState,
        shape: [pointsTextureSize, pointsTextureSize, 4],
        type: 'float',
      }),
      depth: false,
      stencil: false,
    })

    this.highlightedFbo = createHighlightedBuffer(reglInstance, store.pointsTextureSize, store.linksTextureSize)
  }

  public initPrograms (): void {
    const { reglInstance, config, store, data } = this
    this.updatePositionCommand = reglInstance({
      frag: updatePositionFrag,
      vert: updateVert,
      framebuffer: () => this.currentPositionFbo as regl.Framebuffer2D,
      primitive: 'triangle strip',
      count: 4,
      attributes: { quad: createQuadBuffer(reglInstance) },
      uniforms: {
        position: () => this.previousPositionFbo,
        velocity: () => this.velocityFbo,
        friction: () => config.simulation?.friction,
        spaceSize: () => config.spaceSize,
      },
    })
    this.drawCommand = reglInstance({
      frag: drawPointsFrag,
      vert: drawPointsVert,
      primitive: 'points',
      count: () => data.nodes.length,
      attributes: { indexes: createIndexesBuffer(reglInstance, store.pointsTextureSize) },
      uniforms: {
        particleStatus: (_, props: { type: DrawType }) => {
          switch (props.type) {
          case DrawType.DIMMED:
            return 1
          case DrawType.HIGHLIGHTED:
            return 2
          case DrawType.DEFAULT:
          default:
            return 0
          }
        },
        positions: () => this.currentPositionFbo,
        selectedPoints: () => this.selectedFbo,
        highlightedPoints: () => this.highlightedFbo,
        clickedPointId: () => this.clickedId,
        particleColor: () => this.colorFbo,
        particleSize: () => this.sizeFbo,
        ratio: () => config.pixelRatio,
        sizeMultiplier: () => config.nodeSizeMultiplier,
        pointsTextureSize: () => store.pointsTextureSize,
        transform: () => store.transform,
        backgroundColor: () => store.backgroundColor,
        spaceSize: () => config.spaceSize,
        screenSize: () => store.screenSize,
      },
      blend: {
        enable: true,
        func: {
          dstRGB: 'one minus src alpha',
          srcRGB: 'src alpha',
          dstAlpha: 'one minus src alpha',
          srcAlpha: 'one',
        },
        equation: {
          rgb: 'add',
          alpha: 'add',
        },
      },
      depth: {
        enable: false,
        mask: false,
      },
    })
    this.findPointCommand = reglInstance({
      frag: findPointFrag,
      vert: updateVert,
      framebuffer: () => this.selectedFbo as regl.Framebuffer2D,
      primitive: 'triangle strip',
      count: 4,
      attributes: { quad: createQuadBuffer(reglInstance) },
      uniforms: {
        position: () => this.currentPositionFbo,
        particleSize: () => this.sizeFbo,
        spaceSize: () => config.spaceSize,
        screenSize: () => store.screenSize,
        sizeMultiplier: () => config.nodeSizeMultiplier,
        transform: () => store.transform,
        ratio: () => config.pixelRatio,
        'selection[0]': () => store.selectedArea[0],
        'selection[1]': () => store.selectedArea[1],
        isClick: (_, props: { isClick: boolean }) => props.isClick,
      },
    })
  }

  public updateHighlighted (forceLink: ForceLink<N, L>): void {
    const { reglInstance, store } = this
    const { indices, linkFirstIndicesAndAmount } = forceLink
    this.highlightedFbo = createHighlightedBuffer(
      reglInstance,
      store.pointsTextureSize,
      store.linksTextureSize,
      [this.clickedId],
      indices,
      linkFirstIndicesAndAmount
    )
  }

  public updateColor (): void {
    const { reglInstance, config, store, data: { nodes } } = this
    this.colorFbo = createColorBuffer(nodes, reglInstance, store.pointsTextureSize, config.nodeColor)
  }

  public updateSize (): void {
    const { reglInstance, config, store, data: { nodes } } = this
    this.sizeFbo = createSizeBuffer(nodes, reglInstance, store.pointsTextureSize, config.nodeSize)
  }

  public draw (type: DrawType): void {
    this.drawCommand?.({ type })
  }

  public updatePosition (): void {
    this.updatePositionCommand?.()
    this.swapFbo()
  }

  public findPoint (isClick: boolean): void {
    this.findPointCommand?.({ isClick })
  }

  public destroy (): void {
    this.currentPositionFbo?.destroy()
    this.previousPositionFbo?.destroy()
    this.velocityFbo?.destroy()
    this.selectedFbo?.destroy()
    this.highlightedFbo?.destroy()
    this.colorFbo?.destroy()
    this.sizeFbo?.destroy()
  }

  private swapFbo (): void {
    const temp = this.previousPositionFbo
    this.previousPositionFbo = this.currentPositionFbo
    this.currentPositionFbo = temp
  }
}
