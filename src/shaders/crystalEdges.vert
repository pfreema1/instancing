varying vec2 vUv;
varying vec3 vBC;

attribute vec3 barycentric;

void main() {
    vUv = uv;
    vBC = barycentric;

    gl_Position =   projectionMatrix *
                    modelViewMatrix *
                    vec4(position,1.0);
}