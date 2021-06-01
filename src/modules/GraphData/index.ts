import { Node, Link, InputNode, InputLink } from '@/graph/types'

export class GraphData <N extends Node, L extends Link> {
  private _nodes: N[] = []
  private _links: L[] = []

  public setData (inputData: { nodes: InputNode[]; links: InputLink[] }): void {
    const nodes = inputData.nodes.map((n, i) => {
      return {
        ...n,
        degree: 0,
        indegree: 0,
        outdegree: 0,
        index: i,
      }
    })

    const nodesObj: { [key: string]: Node } = {}
    nodes.forEach(n => {
      nodesObj[n.id] = n
    })

    // Calculate node outdegree/indegree value
    inputData.links.forEach(l => {
      nodesObj[l.source].outdegree += 1
      nodesObj[l.target].indegree += 1
    })

    // Calculate node degree value
    nodes.forEach(n => {
      if (!n.degree) n.degree = (n.outdegree ?? 0) + (n.indegree ?? 0)
    })

    // Sort nodes by degree value
    nodes.sort((a, b) => (a.degree ?? 0) - (b.degree ?? 0))

    // Put index to node by ascending from 0
    nodes.forEach((n, i) => {
      n.index = i
    })

    const links = inputData.links.map(l => {
      const sourceNode = nodesObj[l.source]
      const targetNode = nodesObj[l.target]

      return {
        ...l,
        from: sourceNode.index,
        to: targetNode.index,
        source: sourceNode,
        target: targetNode,
      }
    })
    this._nodes = nodes as N[]
    this._links = links as L []
  }

  get nodes (): N[] {
    return this._nodes
  }

  get links (): L[] {
    return this._links
  }
}
