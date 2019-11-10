varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vBC;


void main() {
    vUv = uv;
    vNormal = normalMatrix * normalize(normal);

    gl_Position =   projectionMatrix *
                    modelViewMatrix *
                    vec4(position,1.0);
} 