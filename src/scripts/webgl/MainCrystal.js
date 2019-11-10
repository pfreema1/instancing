import * as THREE from 'three';

export default class MainCrystal {
    constructor(PARAMS) {
        this.PARAMS = PARAMS;

        this.rt = this.returnRenderTargets();

        this.cameras = this.returnCameras();

        this.cameras.edges.position.z = this.cameras.normals.position.z = 30;

        this.scenes = this.returnScenes();

        this.createMeshes();


        this.scenes.edges.add(this.meshes.edges);
        this.scenes.normals.add(this.meshes.normals);
    }

    createMeshes() {
        let edgesGeo = new THREE.TetrahedronBufferGeometry(10, 1);
        let normalsGeo = edgesGeo.clone();
        let edgesMat = this.returnEdgesMaterial();
        let normalsMat = this.returnNormalsMaterial();
        let barycentricData = this.returnBarycentricData(edgesGeo.attributes.position.array);

        // add barycentric data to edgesGeo
        edgesGeo.addAttribute('barycentric', new THREE.Float32BufferAttribute(barycentricData, 3));

        this.meshes = {
            edges: new THREE.Mesh(edgesGeo, edgesMat),
            normals: new THREE.Mesh(normalsGeo, normalsMat)
        };
    }

    returnBarycentricData(vertices) {
        let barycentricData = [];
        let indexCount = 0;
        for (let i = 0; i < vertices.length; i += 3) {
            if (indexCount % 3 === 0) {
                barycentricData.push(1, 0, 0);
            } else if (indexCount % 3 === 1) {
                barycentricData.push(0, 1, 0);
            } else if (indexCount % 3 === 2) {
                barycentricData.push(0, 0, 1);
            }
            indexCount++;
        }

        return barycentricData;
    }

    returnNormalsMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: `
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
		  `,
            fragmentShader: `
			varying vec2 vUv;
			varying mediump vec3 vNormal;

			void main() {
				vec3 view_nv = normalize(vNormal);
				vec3 nv_color = view_nv * 0.5 + 0.5;

				gl_FragColor = vec4(nv_color, 1.0);
			}
			`
        });
    }

    returnEdgesMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                u_edgesThickness: {
                    type: 'f',
                    value: this.PARAMS.edgesThickness
                }
            },
            vertexShader: `
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
		`,
            fragmentShader: `
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
		`
        });
    }

    returnScenes() {
        return {
            edges: new THREE.Scene(),
            normals: new THREE.Scene()
        };
    }

    returnRenderTargets() {
        return {
            edges: new THREE.WebGLRenderTarget(
                window.innerWidth,
                window.innerHeight
            ),
            normals: new THREE.WebGLRenderTarget(
                window.innerWidth,
                window.innerHeight
            )
        }
    }

    returnCameras() {
        return {
            edges: new THREE.PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.01,
                100
            ),
            normals: new THREE.PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.01,
                100
            )
        }
    }
}