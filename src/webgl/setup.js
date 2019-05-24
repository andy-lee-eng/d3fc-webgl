import { mat4 } from 'gl-matrix';

import triangles from './triangles';
import edges from './edges';

const drawFunctions = {
  triangles,
  edges
};

export default (gl) => {
  const drawModules = {};
  const projectionMatrix = mat4.create();
  const modelViewMatrix = mat4.create();

  const draw = () => {
    clearScene();
  }

  let activated;
  Object.keys(drawFunctions).forEach(key => {
    draw[key] = (...args) => {
      if (!drawModules[key]) {
        drawModules[key] = drawFunctions[key](gl, projectionMatrix, modelViewMatrix);
      }

      if (activated != key) drawModules[key].activate();
      activated = key;
      return drawModules[key](...args);
    };
  });

  draw.triangleStrip = (positions, color) => {
    draw.triangles(positions, color, gl.TRIANGLE_STRIP);
  }

  draw.triangleFan = (positions, color) => {
    draw.triangles(positions, color, gl.TRIANGLE_FAN);
  }

  const normaliseVector = (vector) => {
    const length = Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2));
    return [vector[0] / length, vector[1] / length];
  }

  const lineNormal = (p1, p2) => normaliseVector([p2[1] - p1[1], -(p2[0] - p1[0])]);

  const getNormal = (points, index) => {
    const n1 = (index > 0) && lineNormal([points[index - 2], points[index - 1]], [points[index], points[index + 1]]);
    const n2 = (index < points.length - 2) && lineNormal([points[index], points[index + 1]], [points[index + 2], points[index + 3]]);

    if (!n2) {
      return n1
    } else if (!n1) {
      return n2;
    } else {
      return normaliseVector([(n1[0] + n2[0]) / 2, (n1[1] + n2[1]) / 2]);
    }
  }

  const tf = 0.6;
  draw.line = (positions, width, color) => {
    const points = new Float32Array(positions.length * 2);
    for(let n = 0; n < positions.length; n += 2) {
      const normal = getNormal(positions, n);

      const p = n * 2;
      points[p] = positions[n] + tf * width[0] * normal[0];
      points[p + 1] = positions[n + 1] + tf * width[1] * normal[1];

      points[p + 2] = positions[n] - tf * width[0] * normal[0];
      points[p + 3] = positions[n + 1] - tf * width[1] * normal[1];
    }

    draw.triangles(points, color, gl.TRIANGLE_STRIP);
  };

  initMatrices();

  function initMatrices() {
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.
    const fieldOfView = 90 * Math.PI / 180;   // in radians
    const aspect = 1; //gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
                    fieldOfView,
                    aspect,
                    zNear,
                    zFar);

    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    mat4.translate(modelViewMatrix,     // destination matrix
                  modelViewMatrix,     // matrix to translate
                  [-0.0, 0.0, -1.0]);  // amount to translate
  }

  function clearScene() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // gl.clearDepth(1.0);                 // Clear everything
    // gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    // gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  return draw;
}
