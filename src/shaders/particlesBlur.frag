precision mediump float;
uniform sampler2D bgTexture;
uniform vec2 uResolution;

varying vec2 vUv;

vec3 tex(vec2 uv);

#pragma glslify: blur = require('glsl-hash-blur', sample=tex, iterations=20)

vec3 tex(vec2 uv) {
  return texture2D(bgTexture, uv).rgb;
}

void main() {
    vec4 bgColor = texture2D(bgTexture, vUv);


    float aspect = uResolution.x / uResolution.y;

    vec4 blurColor = vec4(blur(vUv, 0.01, aspect), 1.0);
    gl_FragColor = vec4(bgColor + blurColor);
}   