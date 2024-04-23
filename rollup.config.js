import vue from 'rollup-plugin-vue';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    name: 'SimpleArcComponent',
    file: 'dist/simple-arc-component.min.js',
    format: 'umd',
    globals: {
      vue: 'Vue'
    }
  },
  plugins: [
    resolve(),
    commonjs(),
    vue({ css: true }),
    terser()  // Minify the bundle
  ],
  external: ['vue']
};
