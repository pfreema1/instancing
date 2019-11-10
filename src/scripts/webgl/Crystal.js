import * as THREE from 'three';
import glslify from 'glslify';

import crystalNormalsFrag from '../../shaders/crystalNormals.frag';
import crystalNormalsVert from '../../shaders/crystalNormals.vert';
import crystalEdgesFrag from '../../shaders/crystalEdges.frag';
import crystalEdgesVert from '../../shaders/crystalEdges.vert';


export default class Crystal {
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
        let edgesGeo = new THREE.TetrahedronBufferGeometry(10, 2);
        let normalsGeo = edgesGeo.clone();
        let edgesMat = this.returnEdgesMaterial();
        let normalsMat = this.returnNormalsMaterial();
        let barycentricData = this.returnBarycentricData(
            edgesGeo.attributes.position.array
        );

        // add barycentric data to edgesGeo
        edgesGeo.addAttribute(
            'barycentric',
            new THREE.Float32BufferAttribute(barycentricData, 3)
        );

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
            vertexShader: glslify(crystalNormalsVert),
            fragmentShader: glslify(crystalNormalsFrag)
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
            vertexShader: glslify(crystalEdgesVert),
            fragmentShader: glslify(crystalEdgesFrag)
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
            edges: new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
            normals: new THREE.WebGLRenderTarget(
                window.innerWidth,
                window.innerHeight
            )
        };
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
        };
    }
}
