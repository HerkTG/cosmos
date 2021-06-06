import _isPlainObject from 'lodash/isPlainObject'
import _merge from 'lodash/merge'
import { Node, Link, InputNode, InputLink } from '@/graph/types'
import { defaultNodeColor, defaultNodeSize, defaultLinkColor, defaultLinkWidth, defaultConfigValues } from '@/graph/variables'

export type NumericAccessor<Datum> = ((d: Datum, i?: number) => number | null) | number | null | undefined
export type StringAccessor<Datum> = ((d: Datum, i?: number) => string) | string | undefined
export interface GraphConfigInterface<N extends InputNode, L extends InputLink> {
  /**
   * Canvas background color.
   * Default value: '#222222'
   */
  backgroundColor?: string;
  /**
   * Simulation space side length.
   * Default value: 4096
   */
  spaceSize?: number;
  /**
   * Node color accessor function or value.
   * Default value: '#b3b3b3'
  */
  nodeColor?: StringAccessor<N>;
  /**
   * Node size accessor function or value in pixels.
   * Default value: 4
  */
  nodeSize?: NumericAccessor<N>;
  /**
   * The number by which nodeSize is multiplied.
   * Default value: 1
   */
  nodeSizeMultiplier?: number;

  /**
   * Link color accessor function or value.
   * Default value: '#666666'
   */
  linkColor?: StringAccessor<L>;
  /**
   * Link width accessor function or value in pixels.
   * Default value: 1
  */
  linkWidth?: NumericAccessor<L>;
  /**
   * The number by which linkWidth is multiplied.
   * Default value: 1
   */
  linkWidthMultiplier?: number;
  /**
   * Whether render links or not.
   * Default value: true
   */
  renderLinks?: boolean;
  /**
   * Whether render curve links or not.
   * Default value: false
   */
  curveLinks?: boolean;
  /**
   * Whether render link's arrows or not.
   * Default value: true
   */
  arrowLinks?: boolean;

  /** Simulation parameters */
  simulation?: {
    /**
     * Decay coefficient. Small values for quick simulation.
     * Default value: 1000
     */
    decay?: number;
    /**
     * Gravity force coefficient.
     * Default value: 0
     */
    gravity?: number;
    /**
     * Centering to center mass force coefficient.
     * Default value: 0
     */
    center?: number;
    /**
     * Collision force coefficient.
     * Default value: 0.1
     */
    collision?: number;
    /**
     * Barnes–Hut approximation criterion.
     * Default value: 1.7
     */
    collisionTheta?: number;
    /**
     * Barnes–Hut approximation depth.
     * Default value: 12
     */
    collisionQuadtreeLevels?: number;
    /**
     * Spring force coefficient.
     * Default value: 1
     */
    spring?: number;
    /**
     * Minimum link distance.
     * Default value: 2
     */
    linkDistance?: number;
    /**
     * Range of random link distance values.
     * Default value: [1, 1.2]
     */
    linkDistRandomVariationRange?: number[];
    /**
     * Repulsion coefficient from mouse position.
     * Default value: 2
     */
    repulsionFromMouse?: number;
    /**
     * Friction value from 0 to 1.
     * Default value: 0.85
     */
    friction?: number;
    /**
     * On start simulation callback function.
     * Default value: undefined
     */
    onStart?: () => void;
    /**
     * On tick simulation callback function.
     * Default value: undefined
     */
    onTick?: (alpha: number) => void;
    /**
     * On end simulation callback function.
     * Default value: undefined
     */
    onEnd?: () => void;
    /**
     * On pause simulation callback function.
     * Default value: undefined
     */
    onPause?: () => void;
    /**
     * On restart simulation callback function.
     * Default value: undefined
     */
    onRestart?: () => void;
  };
  /**
   * Events
   */
  event?: {
    /**
     * On click callback function.
     * Default value: undefined
     */
    onClick?: (clickedNode: Node<N> | undefined) => void;
  };

  /**
   * Whether show frame monitor or not.
   * Default value: false
   */
  showFrameMonitor?: boolean;

  pixelRatio?: number;
}

export class GraphConfig<N extends InputNode, L extends InputLink> implements GraphConfigInterface<Node<N>, Link<N, L>> {
  backgroundColor = '#222222'
  spaceSize = defaultConfigValues.spaceSize
  nodeColor = defaultNodeColor
  nodeSize = defaultNodeSize
  nodeSizeMultiplier = 1
  linkColor = defaultLinkColor
  linkWidth = defaultLinkWidth
  linkWidthMultiplier = 1
  renderLinks = true
  curveLinks = false
  arrowLinks = true

  simulation = {
    decay: 1000,
    gravity: defaultConfigValues.gravity,
    center: 0,
    collision: 0.1,
    collisionTheta: 1.7,
    collisionQuadtreeLevels: 12,
    spring: 1,
    linkDistance: 2,
    linkDistRandomVariationRange: [1, 1.2],
    repulsionFromMouse: 2,
    friction: 0.85,
    onStart: (): void => undefined,
    onTick: (_: number): void => undefined,
    onEnd: (): void => undefined,
    onPause: (): void => undefined,
    onRestart: (): void => undefined,
  }

  event = {
    onClick: (_: Node<N> | undefined): void => undefined,
  }

  showFrameMonitor = false

  pixelRatio = 2

  init (config: GraphConfigInterface<N, L>): this {
    const keys = Object.keys(config).map(key => key as keyof GraphConfigInterface<N, L>)
    keys.forEach(key => {
      if (_isPlainObject(this[key])) this[key] = _merge(this[key], config[key]) as never
      else this[key] = config[key] as never
    })

    return this
  }
}
