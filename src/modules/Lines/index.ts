import regl from 'regl'
import { getValue, getRgbaColor } from '@/graph/helper'
import { CoreModule } from '@/graph/modules/core-module'
import drawCurveFrag from '@/graph/modules/Lines/draw-curve.frag'
import drawCurveVert from '@/graph/modules/Lines/draw-curve.vert'
import drawStraightFrag from '@/graph/modules/Lines/draw-straight.frag'
import drawStraightVert from '@/graph/modules/Lines/draw-straight.vert'
import { defaultLinkColor, defaultLinkWidth } from '@/graph/variables'
import { InputNode, InputLink } from '@/graph/types'

export enum LineType {
  STRAIGHT = 'straight',
  CURVE = 'curve'
}
export class Lines<N extends InputNode, L extends InputLink> extends CoreModule<N, L> {
  private drawStraightCommand: regl.DrawCommand | undefined
  private drawCurveCommand: regl.DrawCommand | undefined
  private colorBuffer: regl.Buffer | undefined
  private widthBuffer: regl.Buffer | undefined

  public create (): void {
    this.updateColor()
    this.updateWidth()
  }

  public initPrograms (): void {
    const { reglInstance, config, store, data, points } = this
    const { pointsTextureSize } = store

    const geometryLinkBuffer = {
      buffer: reglInstance.buffer([
        [0, -0.5],
        [1, -0.5],
        [1, 0.5],
        [0, -0.5],
        [1, 0.5],
        [0, 0.5],
      ]),
      divisor: 0,
    }

    const instancePoints: number[][] = []
    data.links.forEach(l => {
      const fromX = l.from % pointsTextureSize
      const fromY = Math.floor(l.from / pointsTextureSize)

      const toX = l.to % pointsTextureSize
      const toY = Math.floor(l.to / pointsTextureSize)
      instancePoints.push([fromX, fromY])
      instancePoints.push([toX, toY])
    })
    const pointsBuffer = reglInstance.buffer(instancePoints)

    this.drawStraightCommand = reglInstance({
      vert: drawStraightVert,
      frag: drawStraightFrag,

      attributes: {
        position: geometryLinkBuffer,
        pointA: {
          buffer: () => pointsBuffer,
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 0,
          stride: Float32Array.BYTES_PER_ELEMENT * 4,
        },
        pointB: {
          buffer: () => pointsBuffer,
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 2,
          stride: Float32Array.BYTES_PER_ELEMENT * 4,
        },
        color: {
          buffer: () => this.colorBuffer,
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 0,
          stride: Float32Array.BYTES_PER_ELEMENT * 4,
        },
        width: {
          buffer: () => this.widthBuffer,
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 0,
          stride: Float32Array.BYTES_PER_ELEMENT * 1,
        },
      },
      uniforms: {
        positions: () => points?.currentPositionFbo,
        particleSize: () => points?.sizeFbo,
        transform: () => store.transform,
        pointsTextureSize: () => store.pointsTextureSize,
        nodeSizeMultiplier: () => config.nodeSizeMultiplier,
        widthMultiplier: () => config.linkWidthMultiplier,
        clickedId: () => points?.clickedId,
        backgroundColor: () => store.backgroundColor,
        time: (_, props: { time: number }) => {
          return 2 * (props.time % 2000 / 2000) - 0.5
        },
        useArrow: () => config.arrowLinks,
        spaceSize: () => config.spaceSize,
        screenSize: () => store.screenSize,
        ratio: () => config.pixelRatio,
      },
      cull: {
        enable: true,
        face: 'back',
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
      count: 6, // segmentInstanceGeometry length
      instances: () => data.links.length,
    })

    this.drawCurveCommand = reglInstance({
      vert: drawCurveVert,
      frag: drawCurveFrag,
      attributes: {
        position: geometryLinkBuffer,
        pointA: {
          buffer: () => pointsBuffer,
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 0,
          stride: Float32Array.BYTES_PER_ELEMENT * 4,
        },
        pointB: {
          buffer: () => pointsBuffer,
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 2,
          stride: Float32Array.BYTES_PER_ELEMENT * 4,
        },
        color: {
          buffer: () => this.colorBuffer,
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 0,
          stride: Float32Array.BYTES_PER_ELEMENT * 4,
        },
        width: {
          buffer: () => this.widthBuffer,
          divisor: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 0,
          stride: Float32Array.BYTES_PER_ELEMENT * 1,
        },
      },
      uniforms: {
        positions: () => points?.currentPositionFbo,
        particleSize: () => points?.sizeFbo,
        transform: () => store.transform,
        pointsTextureSize: () => store.pointsTextureSize,
        nodeSizeMultiplier: () => config.nodeSizeMultiplier,
        widthMultiplier: () => config.linkWidthMultiplier,
        clickedId: () => points?.clickedId,
        backgroundColor: () => store.backgroundColor,
        spaceSize: () => config.spaceSize,
        screenSize: () => store.screenSize,
        ratio: () => config.pixelRatio,
      },
      cull: {
        enable: true,
        face: 'back',
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
      count: 6, // segmentInstanceGeometry length
      instances: () => data.links.length,
    })
  }

  public draw (type: LineType, time: number): void {
    if (!this.colorBuffer || !this.widthBuffer) return
    if (type === LineType.STRAIGHT) this.drawStraightCommand?.({ time })
    if (type === LineType.CURVE) this.drawCurveCommand?.()
  }

  public updateColor (): void {
    const { reglInstance, config, data: { links } } = this
    const instancePoints: number[][] = []
    links.forEach(l => {
      const c = getValue(l, config.linkColor) ?? defaultLinkColor
      const rgba = getRgbaColor(c)
      instancePoints.push(rgba)
    })
    this.colorBuffer = reglInstance.buffer(instancePoints)
  }

  public updateWidth (): void {
    const { reglInstance, config, data: { links } } = this
    const instancePoints: any[] = []
    links.forEach(l => {
      instancePoints.push([getValue(l, config.linkWidth) ?? defaultLinkWidth])
    })
    this.widthBuffer = reglInstance.buffer(instancePoints)
  }
}
