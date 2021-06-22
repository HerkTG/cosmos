import { select } from 'd3-selection'
import 'd3-transition'
import { zoomIdentity } from 'd3-zoom'
import _cloneDeep from 'lodash/cloneDeep'
import regl from 'regl'
import { GraphConfig, GraphConfigInterface } from '@/graph/config'
import { getRgbaColor, readPixels } from '@/graph/helper'
import { ForceCenter } from '@/graph/modules/ForceCenter'
import { ForceGravity } from '@/graph/modules/ForceGravity'
import { ForceLink } from '@/graph/modules/ForceLink'
import { ForceManyBody } from '@/graph/modules/ForceManyBody'
import { ForceMouse } from '@/graph/modules/ForceMouse'
import { FrameMonitor } from '@/graph/modules/FrameMonitor'
import { GraphData } from '@/graph/modules/GraphData'
import { Lines, LineType } from '@/graph/modules/Lines'
import { Points, DrawType } from '@/graph/modules/Points'
import { Space } from '@/graph/modules/Space'
import { Store, ALPHA_MIN } from '@/graph/modules/Store'
import { Zoom } from '@/graph/modules/Zoom'
import { Node, Link, InputNode, InputLink } from '@/graph/types'

export class Graph<N extends InputNode, L extends InputLink> {
  private config = new GraphConfig<Node<N>, Link<N, L>>()
  private canvas: HTMLCanvasElement
  private reglInstance: regl.Regl
  private requestAnimationFrameId = 0
  private isRightClickMouse = false

  private graph = new GraphData<N, L>()
  private store = new Store()
  private space: Space<N, L>
  private points: Points<N, L>
  private lines: Lines<N, L>
  private forceGravity: ForceGravity<N, L>
  private forceCenter: ForceCenter<N, L>
  private forceManyBody: ForceManyBody<N, L>
  private forceLink: ForceLink<N, L>
  private forceMouse: ForceMouse<N, L>
  private zoom = new Zoom(this.store)
  private frameMonitor = new FrameMonitor()

  public constructor (canvas: HTMLCanvasElement, config?: GraphConfigInterface<N, L>) {
    if (config) this.config.init(config)

    const w = canvas.clientWidth
    const h = canvas.clientHeight
    this.store.screenSize = [w, h]

    this.canvas = canvas
    select(canvas)
      .attr('width', w * this.config.pixelRatio)
      .attr('height', h * this.config.pixelRatio)
      .call(this.zoom.behavior)
      .on('click', this.onClick.bind(this))
      .on('mousemove', this.onMouseMove.bind(this))
      .on('contextmenu', this.onRightClickMouse.bind(this))

    this.reglInstance = regl({
      canvas: this.canvas,
      attributes: {
        antialias: false,
        preserveDrawingBuffer: true,
        premultipliedAlpha: false,
        alpha: false,
      },
      extensions: ['OES_texture_float', 'ANGLE_instanced_arrays'],
    })

    this.points = new Points(this.reglInstance, this.config, this.store, this.graph)
    this.lines = new Lines(this.reglInstance, this.config, this.store, this.graph, this.points)
    this.space = new Space(this.reglInstance, this.config, this.store, this.graph, this.points)
    this.forceGravity = new ForceGravity(this.reglInstance, this.config, this.store, this.graph, this.points)
    this.forceCenter = new ForceCenter(this.reglInstance, this.config, this.store, this.graph, this.points)
    this.forceManyBody = new ForceManyBody(this.reglInstance, this.config, this.store, this.graph, this.points)
    this.forceLink = new ForceLink(this.reglInstance, this.config, this.store, this.graph, this.points)
    this.forceMouse = new ForceMouse(this.reglInstance, this.config, this.store, this.graph, this.points)

    this.store.backgroundColor = getRgbaColor(this.config.backgroundColor)

    if (this.config.showFrameMonitor) this.frameMonitor = new FrameMonitor(this.canvas)
  }

  public get progress (): number {
    return this.store.simulationProgress
  }

  public get simulationIsRunning (): boolean {
    return this.store.simulationIsRunning
  }

  public get nodes (): Node<N>[] {
    return this.graph.nodes
  }

  public get links (): Link<N, L>[] {
    return this.graph.links
  }

  public setConfig (config: GraphConfigInterface<N, L>): void {
    const prevConfig = _cloneDeep(this.config)
    this.config.init(config)
    if (prevConfig.linkColor !== this.config.linkColor) this.lines.updateColor()
    if (prevConfig.nodeColor !== this.config.nodeColor) this.points.updateColor()
    if (prevConfig.nodeSize !== this.config.nodeSize) this.points.updateSize()
    if (prevConfig.linkWidth !== this.config.linkWidth) this.lines.updateWidth()
    if (prevConfig.backgroundColor !== this.config.backgroundColor) this.store.backgroundColor = getRgbaColor(this.config.backgroundColor)
    if (prevConfig.spaceSize !== this.config.spaceSize) this.update()
    if (prevConfig.showFrameMonitor !== this.config.showFrameMonitor) {
      if (prevConfig.showFrameMonitor) this.frameMonitor = new FrameMonitor(this.canvas)
      else this.frameMonitor.destroy()
    }
    if (Object.keys(config).includes('simulation')) this.start()
  }

  public setData (nodes: InputNode[], links: InputLink[]): void {
    this.graph.setData(nodes, links)
    this.update()
  }

  public findNodesById (id: string): Node<N>[] {
    return this.graph.nodes.filter(node => node.id.toLowerCase().includes(id.toLowerCase()))
  }

  public selectNodeById (node: Node<N>): void {
    if (!node) return
    this.points.clickedId = node.index
    this.points.updateHighlighted(this.forceLink)
    const positionPixels = readPixels(this.reglInstance, this.points.currentPositionFbo as regl.Framebuffer2D)
    const posX = positionPixels[node.index * 4 + 0]
    const posY = positionPixels[node.index * 4 + 1]
    if (posX === undefined || posY === undefined) return
    const relativeX = posX / this.config.spaceSize
    const relativeY = posY / this.config.spaceSize
    const x = relativeX * this.store.screenSize[0]
    const y = this.store.screenSize[1] - relativeY * this.store.screenSize[1]
    const scale = 8
    select(this.canvas)
      .transition()
      .duration(750)
      .call(this.zoom.behavior.transform, zoomIdentity
        .translate(0, 0)
        .scale(scale)
        .translate(-x + this.store.screenSize[0] / (scale * 2), -y + this.store.screenSize[1] / (scale * 2))
      )
  }

  public getNodePositions (): { [key: string]: { x: number; y: number } } {
    const particlePositionPixels = readPixels(this.reglInstance, this.points.currentPositionFbo as regl.Framebuffer2D)
    return this.graph.nodes.reduce<{ [key: string]: { x: number; y: number } }>((acc, curr, i) => {
      const posX = particlePositionPixels[i * 4 + 0]
      const posY = particlePositionPixels[i * 4 + 1]
      if (posX !== undefined && posY !== undefined) {
        acc[curr.id] = {
          x: posX,
          y: posY,
        }
      }
      return acc
    }, {})
  }

  public onSelect (selection: [[number, number], [number, number]] | null): void {
    if (selection) {
      const h = this.store.screenSize[1]
      this.store.selectedArea = [[selection[0][0], (h - selection[1][1])], [selection[1][0], (h - selection[0][1])]]
      this.points.findPoint(false)
      const pixels = readPixels(this.reglInstance, this.points.selectedFbo as regl.Framebuffer2D)
      this.store.selectedIndices = pixels
        .map((pixel, i) => {
          if (i % 4 === 0 && pixel !== 0) return i / 4
          else return 404
        })
        .filter(d => d !== 404)
    } else {
      this.store.selectedIndices = new Float32Array()
    }
  }

  public start (alpha = 1): void {
    if (!this.graph.nodes.length) return
    this.store.simulationIsRunning = true
    this.store.alpha = alpha
    this.store.simulationProgress = 0
    this.config.simulation.onStart?.()
    this.stopFrames()
    this.frame()
  }

  public pause (): void {
    this.store.simulationIsRunning = false
    this.config.simulation.onPause?.()
  }

  public restart (): void {
    this.store.simulationIsRunning = true
    this.config.simulation.onRestart?.()
  }

  public drawOneFrame (): void {
    this.store.simulationIsRunning = false
    this.stopFrames()
    this.frame()
  }

  public destroy (): void {
    this.stopFrames()
    this.forceCenter.destroy()
    this.forceLink.destroy()
    this.forceManyBody.destroy()
    this.reglInstance.destroy()
  }

  private update (): void {
    const { graph } = this
    this.store.pointsTextureSize = Math.ceil(Math.sqrt(graph.nodes.length))
    this.store.linksTextureSize = Math.ceil(Math.sqrt(graph.links.length * 2))
    this.destroy()
    this.points.create()
    this.points.updateSize()
    this.points.updateColor()
    this.lines.create()
    this.space.create()
    this.forceManyBody.create()
    this.forceLink.create()
    this.forceCenter.create()
    this.initPrograms()
    this.start()
  }

  private initPrograms (): void {
    this.points.initPrograms()
    this.lines.initPrograms()
    this.space.initPrograms()
    this.forceGravity.initPrograms()
    this.forceLink.initPrograms()
    this.forceMouse.initPrograms()
    this.forceManyBody.initPrograms()
    this.forceCenter.initPrograms()
  }

  private frame (): void {
    const { config: { simulation, renderLinks }, store: { alpha, simulationIsRunning } } = this
    if (alpha < ALPHA_MIN && simulationIsRunning) this.end()

    this.requestAnimationFrameId = window.requestAnimationFrame((now) => {
      this.frameMonitor.begin()
      this.resizeCanvas()

      this.space.run()

      if (this.isRightClickMouse) {
        if (!simulationIsRunning) this.start(0.1)
        this.forceMouse.run()
        this.points.updatePosition()
      }

      if ((simulationIsRunning && !this.zoom.isRunning)) {
        if (simulation.gravity) {
          this.forceGravity.run()
          this.points.updatePosition()
        }

        if (simulation.center) {
          this.forceCenter.run()
          this.points.updatePosition()
        }

        this.forceManyBody.run()
        this.points.updatePosition()

        this.forceLink.run()
        this.points.updatePosition()

        this.store.alpha += this.store.addAlpha(this.config.simulation.decay)
        if (this.isRightClickMouse) this.store.alpha = Math.max(this.store.alpha, 0.1)
        this.store.simulationProgress = Math.sqrt(Math.min(1, ALPHA_MIN / this.store.alpha))
        this.config.simulation.onTick?.(this.store.alpha)
      }

      // Clear canvas
      this.reglInstance.clear({
        color: this.store.backgroundColor,
        depth: 1,
        stencil: 0,
      })

      if (renderLinks) {
        this.lines.draw(this.config.curveLinks ? LineType.CURVE : LineType.STRAIGHT, now)
      }

      this.points.draw(this.points.clickedId > -1 || this.store.selectedIndices.length > 0 ? DrawType.DIMMED : DrawType.DEFAULT)
      if (this.points.clickedId > -1) this.points.draw(DrawType.HIGHLIGHTED)

      this.frameMonitor.end(now)

      this.frame()
    })
  }

  private stopFrames (): void {
    if (this.requestAnimationFrameId) window.cancelAnimationFrame(this.requestAnimationFrameId)
  }

  private end (): void {
    this.store.simulationIsRunning = false
    this.store.simulationProgress = 1
    this.config.simulation.onEnd?.()
  }

  private onClick (event: MouseEvent): void {
    const h = this.store.screenSize[1]
    this.store.selectedArea = [[event.offsetX, (h - event.offsetY)], [event.offsetX, (h - event.offsetY)]]
    this.points.findPoint(true)
    const pixels = readPixels(this.reglInstance, this.points.selectedFbo as regl.Framebuffer2D)
    const selectedIndices = pixels
      .map((pixel, i) => {
        if (i % 4 === 0 && pixel !== 0) return i / 4
        else return 404
      })
      .filter(d => d !== 404)
    this.store.selectedIndices = selectedIndices
    this.points.clickedId = selectedIndices[selectedIndices.length - 1] ?? -1
    this.points.updateHighlighted(this.forceLink)
    const clickedParticle = selectedIndices.length ? this.graph.nodes[this.points.clickedId] : undefined
    this.config.event.onClick?.(clickedParticle)
  }

  private onMouseMove (event: MouseEvent): void {
    const { x, y, k } = this.zoom.eventTransform
    const h = this.canvas.clientHeight
    const mouseX = event.offsetX
    const mouseY = event.offsetY
    const invertedX = (mouseX - x) / k
    const invertedY = (mouseY - y) / k
    this.store.mousePosition = [invertedX, h - invertedY]
    this.isRightClickMouse = event.which === 3
  }

  private onRightClickMouse (event: MouseEvent): void {
    event.preventDefault()
  }

  private resizeCanvas (): void {
    const prevWidth = +select(this.canvas).attr('width')
    const prevHeight = +select(this.canvas).attr('height')
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight

    if (prevWidth !== w * this.config.pixelRatio || prevHeight !== h * this.config.pixelRatio) {
      this.store.screenSize = [w, h]
      select(this.canvas)
        .attr('width', w * this.config.pixelRatio)
        .attr('height', h * this.config.pixelRatio)
      this.reglInstance.poll()
      select(this.canvas)
        .call(this.zoom.behavior.transform, zoomIdentity)
    }
  }
}

export { InputLink, InputNode } from './types'
export { GraphConfigInterface } from './config'
