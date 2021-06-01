import regl from 'regl'
import { GraphConfig } from '@/graph/config'
import { GraphData } from '@/graph/modules/GraphData'
import { Points } from '@/graph/modules/Points'
import { Store } from '@/graph/modules/Store'
import { Node, Link } from '@/graph/types'

export class CoreModule {
  readonly reglInstance: regl.Regl
  readonly config: GraphConfig<Node, Link>
  readonly store: Store
  readonly data: GraphData<Node, Link>
  readonly points: Points | undefined

  constructor (reglInstance: regl.Regl, config: GraphConfig<Node, Link>, store: Store, data: GraphData<Node, Link>, points?: Points) {
    this.reglInstance = reglInstance
    this.config = config
    this.store = store
    this.data = data
    if (points) this.points = points
  }
}
