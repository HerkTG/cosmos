import { zoom, D3ZoomEvent, ZoomBehavior } from 'd3-zoom'
import { mat3 } from 'gl-matrix'
import { Store } from '@/graph/modules/Store'

export class Zoom {
  readonly store: Store
  public eventTransform: any = { k: 1, x: 0, y: 0 }
  public behavior: ZoomBehavior<HTMLCanvasElement, any> = zoom<HTMLCanvasElement, any>()
    .on('start', () => {
      this.isRunning = true
    })
    .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, any>) => {
      this.eventTransform = event.transform
      const { eventTransform: { x, y, k }, store: { transform, screenSize } } = this
      const w = screenSize[0]
      const h = screenSize[1]
      mat3.projection(transform, w, h)
      mat3.translate(transform, transform, [x, y])
      mat3.scale(transform, transform, [k, k])
      mat3.translate(transform, transform, [w / 2, h / 2])
      mat3.scale(transform, transform, [w / 2, h / 2])
      mat3.scale(transform, transform, [1, -1])
    })
    .on('end', () => {
      this.isRunning = false
    })

  public isRunning = false

  constructor (store: Store) {
    this.store = store
  }
}
