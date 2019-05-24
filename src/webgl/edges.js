import initShaderProgram from './initShaderProgram';
import buffer from './buffer';

// Vertex shader program
const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexEdge;

  uniform vec4 uEdgeColor;
  uniform vec4 uSeriesColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying lowp vec4 vEdge;
  varying lowp vec4 vColor;
  varying lowp vec4 vColorEdge;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = uSeriesColor;
    vColorEdge = uEdgeColor;
    vEdge = aVertexEdge;
  }
`;

const fsSource = `
  varying lowp vec4 vEdge;
  varying lowp vec4 vColor;
  varying lowp vec4 vColorEdge;

  void main() {
    lowp float r = clamp((vEdge[1] - vEdge[0]) / 2.0, 0.0, 1.0);
    gl_FragColor = r * vColor + (1.0 - r) * vColorEdge;
  }
`;

export default (gl, projectionMatrix, modelViewMatrix) => {
  const positionBuffer = buffer(gl);
  const edgeBuffer = buffer(gl);
  const buffers = {
    position: positionBuffer.addr(),
    edges: edgeBuffer.addr(),
  };

  let lastColor = [-1, -1, -1, -1];
  let lastStrokeColor = [-1, -1, -1, -1];
  const draw = (positions, color, lineWidth = 1, strokeColor = null) => {
    positionBuffer(positions);

    const pixelSize = [2 / gl.canvas.width, 2 / gl.canvas.height];
    const pixelDist = (x1, y1, x2, y2) => Math.sqrt(Math.pow((x2 - x1) / pixelSize[0], 2) +  Math.pow((y2 - y1) / pixelSize[1], 2));

    const edges = new Float32Array(positions.length);
    for(let n = 0; n < positions.length; n += 6) {
      const dist1 = pixelDist(positions[n], positions[n + 1], positions[n + 2], positions[n + 3]);
      const dist2 = pixelDist(positions[n], positions[n + 1], positions[n + 4], positions[n + 5]);

      const diff = Math.sqrt(dist1 / dist2);

      const lw1 = lineWidth * diff;
      const lw2 = lineWidth / diff;

      const r1 = (dist1 - lw1);
      const r2 = (dist2 - lw2);

      edges[n] = 0;
      edges[n + 1] = (r1 + r2) / 2;
      edges[n + 2] = dist1;
      edges[n + 3] = r1;
      edges[n + 4] = dist2;
      edges[n + 5] = r2;
    }
    edgeBuffer(edges);

    const sColor = strokeColor || color;
    if (color.some((c, i) => c !== lastColor[i]) || sColor.some((c, i) => c !== lastStrokeColor[i])) {
      setColor(color, sColor);
      lastColor = color;
      lastStrokeColor = sColor;
    }
    drawBuffers(positions.length / 2);
  };

  draw.activate = () => {
    setupProgram(buffers);
    lastColor = [-1, -1, -1, -1];
  };

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexEdge: gl.getAttribLocation(shaderProgram, 'aVertexEdge'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      seriesColor: gl.getUniformLocation(shaderProgram, 'uSeriesColor'),
      edgeColor: gl.getUniformLocation(shaderProgram, 'uEdgeColor'),
    },
  };

  function setupProgram(buffers) {
    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
      const numComponents = 2;  // pull out 2 values per iteration
      const type = gl.FLOAT;    // the data in the buffer is 32bit floats
      const normalize = false;  // don't normalize
      const stride = 0;         // how many bytes to get from one set of values to the next
                                // 0 = use type and numComponents above
      const offset = 0;         // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL how to pull out the edges from the buffer
    {
      const numComponents = 2;  // pull out 2 values per iteration
      const type = gl.FLOAT;    // the data in the buffer is 32bit floats
      const normalize = false;  // don't normalize
      const stride = 0;         // how many bytes to get from one set of values to the next
                                // 0 = use type and numComponents above
      const offset = 0;         // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.edges);
      gl.vertexAttribPointer(
          programInfo.attribLocations.vertexEdge,
          numComponents,
          type,
          normalize,
          stride,
          offset);
      gl.enableVertexAttribArray(
          programInfo.attribLocations.vertexEdge);
    }
  }

  function setColor(color, strokeColor) {
    gl.uniform4fv(
      programInfo.uniformLocations.seriesColor,
      color);
    gl.uniform4fv(
      programInfo.uniformLocations.edgeColor,
      strokeColor);
    }

  function drawBuffers(vertexCount) {
    {
      const offset = 0;
      gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
    }
  }

  return draw;
};
