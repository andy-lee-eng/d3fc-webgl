export default (gl) => {
  let glBuffer = gl.createBuffer();

  const buffer = (array) => {
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);

    const srcArray = (array.constructor === Float32Array) ? array : new Float32Array(array);
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, srcArray, gl.STATIC_DRAW);
    return glBuffer;
  };

  buffer.addr = () => glBuffer;
  return buffer;
};
