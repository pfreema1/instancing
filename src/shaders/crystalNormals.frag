varying vec2 vUv;
varying mediump vec3 vNormal;

void main() {
    vec3 view_nv = normalize(vNormal);
    vec3 nv_color = view_nv * 0.5 + 0.5;

    gl_FragColor = vec4(nv_color, 1.0);
}