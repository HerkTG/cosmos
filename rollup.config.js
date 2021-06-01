import path from 'path'
import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import glslify from 'rollup-plugin-glslify'
import typescript from 'rollup-plugin-typescript2'
import typescriptCompiler from 'typescript'

const libraryName = 'index'
const outputFolder = 'dist'

export default {
  input: 'src/index.ts',
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
      typescript: typescriptCompiler,
    }),
    alias({
      resolve: ['', '/index.ts', '.ts'],
      entries: [
        { find: '@/graph', replacement: path.resolve(__dirname, 'src/') },
      ],
    }),
  ],
}
