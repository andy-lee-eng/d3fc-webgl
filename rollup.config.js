import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const packageName = 'd3fc-webgl';

const external = function (key) {
  return (key.indexOf('d3-') === 0)
      || (key.indexOf('@d3fc/') === 0);
};
const globals = function (key) {
  if (key.indexOf('d3-') === 0) {
    return 'd3';
  }
  if (key.indexOf('@d3fc/') === 0) {
    return 'fc';
  }
};

export default {
  input: 'index.js',
  output: {
    file: `build/${packageName}.js`,
    format: 'umd',
    globals,
    name: 'fcWebgl',
    sourcemap: true,
    compact: true
  },
  plugins: [
    resolve(),
    commonjs(),
    babel({
      babelrc: false,
      presets: [
        ['@babel/preset-env']
      ]
    })
  ],
  external
}
