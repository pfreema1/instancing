import * as THREE from 'three';
import glslify from 'glslify';
import {
	EffectComposer,
	BrightnessContrastEffect,
	EffectPass,
	RenderPass,
	ShaderPass,
	BlendFunction
} from 'postprocessing';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import Crystal from './Crystal';
import RenderTri from './RenderTri';
import Tweakpane from 'tweakpane';
import crystalFrag from '../../shaders/crystal.frag';
import crystalVert from '../../shaders/crystal.vert';
import particlesBlurFrag from '../../shaders/particlesBlur.frag';

function remap(t, old_min, old_max, new_min, new_max) {
	let old_range = old_max - old_min;
	let normalizedT = t - old_min;
	let normalizedVal = normalizedT / old_range;
	let new_range = new_max - new_min;
	let newVal = normalizedVal * new_range + new_min;
	return newVal;
}

export default class WebGLView {
	constructor(app) {
		this.app = app;

		this.init();
	}

	async init() {
		this.PARAMS = {
			edgesThickness: 3.26,
			edgesRenderStrength: 15,
			chromaticAberrMod: 0.22,
			pointLightColor: '#fff0ff',
			pointLightIntensity: 1,
			pointLightDistance: 500,
			pointLightDecay: 1
		};

		// this.pane = new Tweakpane();
		this.initThree();
		this.initParticlesRenderTarget();
		this.initObjects();
		this.initLights();
		this.initControls();
		// this.initPostProcessing();
		this.initMainCrystal();
		// this.addPaneParams();
		this.initMouseListener();

		this.resize();

		this.initParticlesBlurTri();
		this.initCrystalRenderTri();

	}

	initMainCrystal() {
		this.mainCrystal = new Crystal(this.PARAMS);

		// caching references
		this.mainCrystalEdgesMesh = this.mainCrystal.meshes.edges;
		this.mainCrystalNormalsMesh = this.mainCrystal.meshes.normals;

		this.mainCrystalEdgesRt = this.mainCrystal.rt.edges;
		this.mainCrystalNormalsRt = this.mainCrystal.rt.normals;

		this.mainCrystalEdgesScene = this.mainCrystal.scenes.edges;
		this.mainCrystalEdgesCamera = this.mainCrystal.cameras.edges;

		this.mainCrystalNormalsScene = this.mainCrystal.scenes.normals;
		this.mainCrystalNormalsCamera = this.mainCrystal.cameras.normals;
	}

	initMouseListener() {
		this.mouse = new THREE.Vector2();
		this.renderer.domElement.addEventListener('mousemove', (e) => {
			this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
			this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
		});
	}

	initParticlesBlurTri() {
		this.resolution = new THREE.Vector2();
		this.renderer.getDrawingBufferSize(this.resolution);
		let uniforms = {
			bgTexture: { value: this.particlesRt.texture },
			uResolution: { value: this.resolution },
		};


		this.particlesBlurTri = new RenderTri(this.renderer, particlesBlurFrag, null, uniforms);

		this.particlesBlurTri.scene = new THREE.Scene();
		this.particlesBlurTri.camera = new THREE.OrthographicCamera();

		this.particlesBlurTri.uniforms = uniforms;

		this.particlesBlurTri.scene.add(this.particlesBlurTri.mesh);

		// caching references
		this.particlesBlurTriRt = this.particlesBlurTri.rt;
		this.particlesBlurTriScene = this.particlesBlurTri.scene;
		this.particlesBlurTriCamera = this.particlesBlurTri.camera;

	}

	initCrystalRenderTri() {
		this.crystalRenderTri = new RenderTri(this.renderer, crystalFrag, crystalVert, this.returnCrystalRenderTriUniforms());
		this.scene.add(this.crystalRenderTri.mesh);

	}

	returnCrystalRenderTriUniforms() {
		return {
			bgTexture: {
				type: 't',
				value: this.particlesRt.texture
			},
			blurBgTexture: {
				type: 't',
				value: this.particlesBlurTri.rt.texture
			},
			normalsTexture: {
				type: 't',
				value: this.mainCrystal.rt.normals.texture
			},
			edgesTexture: {
				type: 't',
				value: this.mainCrystal.rt.edges.texture
			},
			edgesRenderStrength: {
				value: this.PARAMS.edgesRenderStrength
			},
			chromaticAberrMod: {
				value: this.PARAMS.chromaticAberrMod
			},
			uResolution: { value: this.resolution },
			uTime: {
				value: 0.0
			}
		}
	}

	addPaneParams() {
		this.pane
			.addInput(this.PARAMS, 'edgesThickness', {
				min: 0.0,
				max: 10.0
			})
			.on('change', value => {
				this.mainCrystal.meshes.edges.material.uniforms.u_edgesThickness.value = value;
			});

		this.pane
			.addInput(this.PARAMS, 'edgesRenderStrength', {
				min: 0.1,
				max: 24.0
			})
			.on('change', value => {
				this.triMaterial.uniforms.edgesRenderStrength.value = value;
				// fsQuadUniforms.edgesRenderStrength.value = value;
			});

		this.pane
			.addInput(this.PARAMS, 'chromaticAberrMod', {
				min: 0.0,
				max: 10.0
			})
			.on('change', value => {
				this.triMaterial.uniforms.chromaticAberrMod.value = value;
				// fsQuadUniforms.chromaticAberrMod.value = value;
			});

		// point light
		const pl = this.pane.addFolder({ title: 'Point Light' });
		pl.addInput(this.PARAMS, 'pointLightColor').on('change', value => {
			this.pointLight.color = value;
		});
	}

	initThree() {
		this.scene = new THREE.Scene();

		this.camera = new THREE.OrthographicCamera();

		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		this.renderer.autoClear = true;

		this.clock = new THREE.Clock();
	}


	initParticlesRenderTarget() {
		this.particlesRt = new THREE.WebGLRenderTarget(
			window.innerWidth,
			window.innerHeight
		);
		this.particlesRtCamera = new THREE.PerspectiveCamera(
			50,
			window.innerWidth / window.innerHeight,
			0.01,
			100
		);
		this.particlesRtCamera.position.z = 30;

		this.particlesRtScene = new THREE.Scene();
	}

	initControls() {
		this.trackball = new TrackballControls(
			this.camera,
			this.renderer.domElement
		);
		this.trackball.rotateSpeed = 2.0;
		this.trackball.enabled = true;
	}

	initLights() {
		this.pointLight = new THREE.PointLight(
			this.PARAMS.pointLightColor,
			this.PARAMS.pointLightIntensity,
			this.PARAMS.pointLightDistance,
			this.PARAMS.pointLightDecay
		);
		this.pointLight.position.set(0, 0, 50);
		this.particlesRtScene.add(this.pointLight);
	}

	initObjects() {
		this.particleCount = 100;
		this.particles = [];

		for (let i = 0; i < this.particleCount; i++) {
			let mesh = this.createMesh();
			this.randomizeTransform(mesh);
			this.addAttributes(mesh);
			this.particlesRtScene.add(mesh);
			// this.scene.add(mesh);

			this.particles.push(mesh);
		}
	}

	addAttributes(mesh) {
		mesh.speed = {
			rotation: Math.random() * 0.01,
			y: Math.random() * 0.03 + 0.01
		};
	}

	randomizeTransform(mesh) {
		/*
					x range:  -30 to 30
					y range:  -15 to 15
					z range: 10 to -50
			*/
		mesh.position.x = remap(Math.random(), 0, 1, -30, 30);
		mesh.position.y = remap(Math.random(), 0, 1, -25, 25);
		mesh.position.z = remap(Math.random(), 0, 1, -20, 10);

		mesh.rotation.x = Math.random() * 2 * Math.PI;
		mesh.rotation.y = Math.random() * 2 * Math.PI;
		mesh.rotation.z = Math.random() * 2 * Math.PI;
	}

	updateParticles() {
		for (let i = 0; i < this.particleCount; i++) {
			let particle = this.particles[i];

			particle.position.y += particle.speed.y;

			particle.rotation.x += particle.speed.rotation;
			particle.rotation.z += particle.speed.rotation;

			this.checkEdge(particle);
		}
	}

	checkEdge(particle) {
		if (particle.position.y > 25) {
			particle.position.y = -25;
		}
	}

	createMesh() {
		let geo = new THREE.TetrahedronBufferGeometry(1, 0);
		// let mat = new THREE.MeshPhongMaterial();
		// mat.shininess = 100;
		let mat = new THREE.MeshPhysicalMaterial({
			roughness: 0.5,
			metalness: 0.3,
			reflectivity: 1,
			clearcoat: 1,
			color: 0xffffff
		});
		return new THREE.Mesh(geo, mat);
	}

	initPostProcessing() {
		this.composer = new EffectComposer(this.renderer);
		this.composer.enabled = false;

		const renderPass = new RenderPass(this.scene, this.camera);
		renderPass.renderToScreen = false;

		const contrastEffect = new BrightnessContrastEffect({ contrast: 1 });
		const contrastPass = new EffectPass(this.camera, contrastEffect);
		contrastPass.renderToScreen = true;

		this.composer.addPass(renderPass);
		this.composer.addPass(contrastPass);

		// kickstart composer
		this.composer.render(1);
	}

	resize() {
		if (!this.renderer) return;
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.fovHeight =
			2 *
			Math.tan((this.camera.fov * Math.PI) / 180 / 2) *
			this.camera.position.z;
		this.fovWidth = this.fovHeight * this.camera.aspect;

		this.renderer.setSize(window.innerWidth, window.innerHeight);

		// this.composer.setSize(window.innerWidth, window.innerHeight);

		if (this.trackball) this.trackball.handleResize();
	}

	update() {
		const delta = this.clock.getDelta();
		const time = performance.now() * 0.0005;

		// if (this.triMaterial) {
		// 	this.triMaterial.uniforms.uTime.value = time;
		// }

		if (this.particleCount) {
			this.updateParticles();
		}

		if (this.trackball) this.trackball.update();
	}

	draw() {
		if (this.mainCrystal) {
			// rotate crystals
			this.mainCrystalEdgesMesh.rotation.y += this.mouse.y * 0.009;
			this.mainCrystalEdgesMesh.rotation.z += this.mouse.x * 0.009;
			this.mainCrystalEdgesMesh.rotation.x += 0.005;
			this.mainCrystalNormalsMesh.rotation.y += this.mouse.y * 0.009;
			this.mainCrystalNormalsMesh.rotation.z += this.mouse.x * 0.009;
			this.mainCrystalNormalsMesh.rotation.x += 0.005;


			// render bg particles
			this.renderer.setRenderTarget(this.particlesRt);
			this.renderer.render(this.particlesRtScene, this.particlesRtCamera);
			this.renderer.setRenderTarget(null);

			// render blurred bg particles
			this.renderer.setRenderTarget(this.particlesBlurTriRt);
			this.renderer.render(this.particlesBlurTriScene, this.particlesBlurTriCamera);
			this.renderer.setRenderTarget(null);

			// render crystal edges
			this.renderer.setRenderTarget(this.mainCrystalEdgesRt);
			this.renderer.render(
				this.mainCrystalEdgesScene,
				this.mainCrystalEdgesCamera
			);
			this.renderer.setRenderTarget(null);

			// render crystal normal
			this.renderer.setRenderTarget(this.mainCrystalNormalsRt);
			this.renderer.render(
				this.mainCrystalNormalsScene,
				this.mainCrystalNormalsCamera
			);
			this.renderer.setRenderTarget(null);


			this.renderer.render(this.scene, this.camera);
			// this.renderer.render(this.mainCrystal.scenes.normals, this.mainCrystal.cameras.normals);
		}
	}
}
