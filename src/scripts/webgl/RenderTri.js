// mostly taken from here: https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7

import * as THREE from 'three';

const defaultVertexShader = `precision highp float;
  attribute vec2 position;
  
  void main() {
    // Look ma! no projection matrix multiplication,
    // because we pass the values directly in clip space coordinates.
    gl_Position = vec4(position, 1.0, 1.0);
  }`;

const defaultFragmentShader = `precision highp float;
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  
  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec3 color = vec3(uv, 1.0);
    color = texture2D(uScene, uv).rgb;
  
    // Do your cool postprocessing here
    color.r += sin(uv.x * 50.0);
  
    gl_FragColor = vec4(color, 1.0);
  }`;



export default class RenderTri {
    constructor(renderer, fragmentShader, vertexShader, uniforms) {
        this.renderer = renderer;


        this.geometry = this.returnRenderTriGeometry();
        this.resolution = new THREE.Vector2();
        this.renderer.getDrawingBufferSize(this.resolution);

        this.rt = new THREE.WebGLRenderTarget(this.resolution.x, this.resolution.y, {
            format: THREE.RGBFormat,
            stencilBuffer: false,
            depthBuffer: true
        });

        this.setupMaterial(uniforms, fragmentShader, vertexShader);

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.frustumCulled = false;
    }

    setupMaterial(uniforms, fragmentShader, vertexShader) {
        this.fragmentShader = fragmentShader ? fragmentShader : defaultFragmentShader;
        this.vertexShader = vertexShader ? vertexShader : defaultVertexShader;
        this.uniforms = uniforms ? uniforms : this.returnDefaultUniforms();
        this.material = new THREE.RawShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: this.fragmentShader,
            vertexShader: this.vertexShader
        });
    }

    returnDefaultUniforms() {
        return {
            uScene: { value: this.rt.texture },
            uResolution: { value: this.resolution },
        };
    }

    returnRenderTriGeometry() {
        const geometry = new THREE.BufferGeometry();

        // triangle in clip space coords
        const vertices = new Float32Array([-1.0, -1.0, 3.0, -1.0, -1.0, 3.0]);
        const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);

        geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2));
        geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        return geometry;
    }


}