varying vec2 vUv;
varying vec3 vBC;

uniform float u_edgesThickness;

void main() {
    float color = pow(distance(vec3(0.33), vBC), u_edgesThickness);
    vec3 white = vec3(1.0, 1.0, 1.0);
    // x * y * z = 0 if any of the components is 0
    float line = 1.0 - smoothstep(0.0, 0.005, vBC.x * vBC.y * vBC.z);
    vec3 finalColor = mix(vec3(color), white, line);
    gl_FragColor = vec4(finalColor, 1.0);
}