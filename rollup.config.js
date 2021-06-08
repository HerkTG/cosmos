import path from 'path'
import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import glslify from 'rollup-plugin-glslify'
import typescript from 'rollup-plugin-typescript2'
import ttypescript from 'ttypescript'
import pkg from './package.json'

const libraryName = 'index'
const outputFolder = 'dist'

const d3Libs = ['d3-array', 'd3-axis', 'd3-brush', 'd3-chord', 'd3-collection', 'd3-color',
  'd3-contour', 'd3-dispatch', 'd3-drag', 'd3-dsv', 'd3-ease', 'd3-fetch', 'd3-force',
  'd3-format', 'd3-geo', 'd3-hierarchy', 'd3-interpolate', 'd3-path',
  'd3-polygon', 'd3-quadtree', 'd3-random', 'd3-sankey', 'd3-scale', 'd3-scale-chromatic',
  'd3-selection', 'd3-shape', 'd3-time', 'd3-time-format', 'd3-timer', 'd3-transition',
  'd3-voronoi', 'd3-zoom']

const lodashLibs = ['lodash/isUndefined', 'lodash/isArray', 'lodash/isEmpty', 'lodash/isEqual',
  'lodash/isNil', 'lodash/cloneDeep', 'lodash/throttle', 'lodash/each', 'lodash/filter',
  'lodash/get', 'lodash/without', 'lodash/find', 'lodash/isString', 'lodash/isObject',
  'lodash/isFunction', 'lodash/isNumber', 'lodash/merge', 'lodash/isPlainObject', 'lodash/flatten',
  'lodash/omit', 'lodash/extend', 'lodash/groupBy', 'lodash/uniq', 'lodash/sortBy', 'lodash/range',
  'lodash/findIndex']

const externals = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  ...d3Libs,
  ...lodashLibs,
]
export default {
  input: 'src/index.ts',
  external: externals,
  output: [
    {
      file: `${outputFolder}/${libraryName}.js`,
      name: libraryName,
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    glslify({
      include: [
        '**/*.vs',
        '**/*.fs',
        '**/*.vert',
        '**/*.frag',
        '**/*.glsl',
      ],
      exclude: 'node_modules/**',
    }),
    typescript({
      typescript: ttypescript,
    }),
    alias({
      resolve: ['', '/index.ts', '.ts'],
      entries: [
        { find: '@/graph', replacement: path.resolve(__dirname, 'src/') },
      ],
    }),
  ],
}
