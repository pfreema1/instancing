precision highp float;
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
    vUv = uv;
    // Look ma! no projection matrix multiplication,
    // because we pass the values directly in clip space coordinates.
    gl_Position = vec4(position, 1.0, 1.0);
}