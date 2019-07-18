import {rebindAll} from '@d3fc/d3fc-rebind';
import baseShader from './base';

// Shader program to draw filled triangles

// Vertex shader program
const vsSource = `
  attribute vec4 aVertexPosition;

  uniform vec2 uOffset;
  uniform vec2 uScale;

  void main() {
    vec2 vertex = vec2(aVertexPosition[0], aVertexPosition[1]);
    vec2 clipSpace = 2.0 * (vertex - uOffset) / uScale - 1.0;
    gl_Position = vec4(clipSpace, 0.0, 1.0);
  }
`;

const fsSource = `
  precision mediump float;
  uniform vec4 uSeriesColor;

  void main() {
    gl_FragColor = uSeriesColor;
  }
`;

// Available modes:
// gl.TRIANGLES
// gl.TRIANGLE_STRIP
// gl.TRIANGLE_FAN
// gl.LINES
// gl.LINES_STRIP
export default (gl) => {
    const base = baseShader(gl, vsSource, fsSource);

    const draw = (positions, color, mode = gl.TRIANGLES, offset = 0, count = -1) => {
        base(positions, color, mode, offset, count);
    };

    rebindAll(draw, base);
    return draw;
};
