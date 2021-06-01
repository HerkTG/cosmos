export type InputNode = {
  id: string;
}

export type InputLink = {
  source: string;
  target: string;
}

export type Node = {
  id: string;
  index?: number;
  degree?: number;
  outdegree: number;
  indegree: number;
}

export type Link = {
  from: number;
  to: number;
  source: Node;
  target: Node;
}
