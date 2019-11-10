precision mediump float;
#define sat(x) clamp(x, 0.0, 1.0);

uniform sampler2D bgTexture;
uniform sampler2D normalsTexture;
uniform sampler2D edgesTexture;
uniform float edgesRenderStrength;
uniform float chromaticAberrMod;

varying vec2 vUv;

float remap01(float a, float b, float t) {
    return sat((t - a) / (b - a));
}


float remap(float a, float b, float c, float d, float t) {
        return remap01(a, b, t) * (d - c) + c;
}

void main() {
    vec4 bgColor = texture2D(bgTexture, vUv);
    vec4 normalColor = texture2D(normalsTexture, vUv);
    vec4 edgesColor = texture2D(edgesTexture, vUv);
    vec3 normal = normalize(normalColor.rgb * 2.0 - 1.0);

    // remap edges color
    float edgeVal = remap(0.0, 1.0, 0.0, 0.7, edgesColor.r);

    vec3 refractVec1 = refract(vec3(0.0, 0.0, 1.0), normal, chromaticAberrMod);
    vec3 refractVec2 = refract(vec3(0.05, 0.0, 1.0), normal, chromaticAberrMod);
    vec3 refractVec3 = refract(vec3(-0.05, 0.0, 1.0), normal, chromaticAberrMod);
    vec4 refractColor1 = texture2D(bgTexture, vUv + (refractVec1.xy * edgesColor.r));
    vec4 refractColor2 = texture2D(bgTexture, vUv + (refractVec2.xy * edgesColor.r));
    vec4 refractColor3 = texture2D(bgTexture, vUv + (refractVec3.xy * edgesColor.r));

    vec4 chromAberrColor = vec4(refractColor1.r, refractColor2.g, refractColor3.b, 1.0);

    vec3 refractVec = refract(vec3(0.0, 0.0, 1.0), normal, 0.0);
    vec4 refractColor = texture2D(bgTexture, vUv + (refractVec.xy * edgesColor.r));

    vec4 color = refractColor;

    // mix in chromatic aberration colors
    color = mix(refractColor, chromAberrColor, edgesColor.r);

    // mix in the edges color white
    color = mix(color, edgesColor, edgesColor.r / edgesRenderStrength);


    gl_FragColor = vec4(color);
}