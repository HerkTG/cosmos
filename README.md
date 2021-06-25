<p align="center" style="color: #444">
  <h1 align="center">🌌 Cosmos</h1>
</p>
<p align="center" style="font-size: 1.2rem;">GPU-accelerated Force Graph</p>

> ⚠️ **The current version of the algorithm can be unstable and not work on all platforms.** See the Requirements section below for more details

Cosmos is a WebGL Force Graph layout algorithm and rendering engine. All the computations and drawing are happening on the GPU in fragment and vertex shaders avoiding expensive memory operations. That enables real time simulation of network graphs consisting of more than a million of nodes and edges on a modern hardware.

[🎮 200K nodes + 200K edges example](https://codesandbox.io/...)

### Quick Start

Install the package

```bash
npm install --save @cosmograph-org/cosmos
```

Get your data and run the simulation
```javascript
import { Graph } from ‘cosmograph’
import { nodes, edges } from ‘./data’

const canvas = document.querySelector(‘canvas’)
const config = {
  graph: {
    strength: link => link.weight,
  },
  renderLinks: true,
  linkColor: link => link.linkColor,
  nodeColor: node => node.codeColor,
  event: {
    click: node => { console.log(‘Clicked node: ‘, node},
  },
  /* ... */
}

const graph = new Graph(canvas, config)

graph.setData({ nodes, edges })
```

### Examples

- [Bitcoin Transactions](https://cosmograph.app)
- [Network Security Logs](https://cosmograph.app)

### Licence
During the development of [Cosmograph](https://cosmograph.app) — our new visual tool for transaction analysis — Cosmos will not be available for commercial use. But you can freely use it in your educational, art or research projects.

### Contact
Have questions? Write us!

[📩 hi@cosmograph.app](mailto:hi@cosmograph.app)