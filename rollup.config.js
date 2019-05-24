import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

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
    name: 'fcWebGL',
    sourcemap: true,
    compact: true
  },
  plugins: [
      babel({
          babelrc: false,
          presets: [
              ['@babel/preset-env']
          ]
      }),
      resolve({ mainFields: ['module'] })
  ],
  external
}
