if (
    typeof require !== "undefined" &&
    (typeof window === "undefined" ||
        // eslint-disable-next-line camelcase
        typeof __webpack_require__ !== "undefined" ||
        (typeof navigator !== "undefined" && navigator.product === "ReactNative"))
) {
    // eslint-disable-next-line no-redeclare
    const base = require("../../base");
    // eslint-disable-next-line no-redeclare
    // eslint-disable-next-line no-var
    var ripe = base.ripe;
}

/**
 * @class
 * @classdesc Class that handles the load and dispose operations of all assets,
 * including meshes, textures, animations and materials.
 *
 * @param {CSR} csr The base CSR instance.
 * @param {Object} owner The owner (customizer instance) for
 * the configurator.
 * @param {Object} options The options to be used to configure the
 * asset manager.
 */
ripe.CSRPostProcess = function(csr, options) {
    this.csr = csr;
    this.library = options.postProcessingLibrary;
    this._setPostProcessOptions(options);
    this.debug = options.debug;
};

ripe.CSRPostProcess.prototype = ripe.build(ripe.Observable.prototype);
ripe.CSRPostProcess.prototype.constructor = ripe.CSRPostProcess;

ripe.CSRPostProcess.prototype.updateOptions = async function(options) {
    this.library =
        options.postProcessingLibrary === undefined ? this.library : options.postProcessingLibrary;
    this.postProcessing =
        options.postProcessing === undefined ? this.postProcessing : options.postProcessing;
};

/**
 * Creates the render passes and adds them to the effect composer.
 */
ripe.CSRPostProcess.prototype.setup = async function(csr) {
    this.composer = new this.library.EffectComposer(csr.renderer);
    this.renderPass = new this.library.RenderPass(csr.scene, csr.camera);

    this.composer.addPass(this.renderPass);

    await this._setupBloomPass(csr.camera);
    await this._setupAAPass(csr.camera, csr.renderer);

    const normalPass = new this.library.NormalPass(csr.scene, csr.camera);
    await this._setupAOPass(normalPass, csr);

    // solve artefacts for Skinned Meshes
    this.library.OverrideMaterialManager.workaroundEnabled = true;
};

ripe.CSRPostProcess.prototype._setPostProcessOptions = function(options = {}) {
    if (!options.postProcess) return;

    const postProcOptions = options.postProcess;

    this.exposure =
        postProcOptions.exposure === undefined ? this.exposure : postProcOptions.exposure;
    this.shadowBias =
        postProcOptions.shadowBias === undefined ? this.shadowBias : postProcOptions.shadowBias;
    this.radius = postProcOptions.radius === undefined ? this.radius : postProcOptions.radius;

    if (postProcOptions.bloom) this.bloomOptions = postProcOptions.bloom;
    if (postProcOptions.antialiasing) this.aaOptions = postProcOptions.antialiasing;
    if (postProcOptions.ambientOcclusion) this.aoOptions = postProcOptions.ambientOcclusion;
};

/**
 * @ignore
 */
ripe.CSRPostProcess.prototype._setupBloomPass = async function(camera) {
    const blendFunction = this.library.BlendFunction.SCREEN;
    const kernelSize = this.library.KernelSize.MEDIUM;
    const luminanceSmoothing = 0.075;
    const bloomHeight = 480;

    const baseBloomConfig = {
        blendFunction: blendFunction,
        kernelSize: kernelSize,
        luminanceSmoothing: luminanceSmoothing,
        height: bloomHeight
    };

    this.bloomEffect = new this.library.BloomEffect(baseBloomConfig);

    this.bloomEffect.luminanceMaterial.threshold =
        this.bloomOptions.threshold === undefined ? 0.9 : this.bloomOptions.threshold;
    this.bloomEffect.intensity =
        this.bloomOptions.intensity === undefined ? 0.5 : this.bloomOptions.intensity;
    this.bloomEffect.blendMode.opacity.value =
        this.bloomOptions.opacity === undefined ? 0.7 : this.bloomOptions.opacity;

    if (this.debug) this.csr.gui.setupBloom(this.bloomEffect);

    this.composer.addPass(new this.library.EffectPass(camera, this.bloomEffect));
};

/**
 * @ignore
 */
ripe.CSRPostProcess.prototype._setupAAPass = async function(camera, renderer) {
    const loadingManager = new this.csr.library.LoadingManager();
    const smaaImageLoader = new this.library.SMAAImageLoader(loadingManager);

    const self = this;

    // encapsulates the loader logic around a promise and waits
    // for it to be finalized in success or in error
    await new Promise((resolve, reject) => {
        smaaImageLoader.load(([search, area]) => {
            self.smaaEffect = new self.library.SMAAEffect(
                search,
                area,
                self.library.SMAAPreset.HIGH,
                self.library.EdgeDetectionMode.COLOR
            );

            // the following variables are used in
            // the debug GUI (for the CSR)
            self.edgesTextureEffect = new self.library.TextureEffect({
                blendFunction: self.library.BlendFunction.SKIP,
                texture: self.smaaEffect.renderTargetEdges.texture
            });

            self.weightsTextureEffect = new self.library.TextureEffect({
                blendFunction: self.library.BlendFunction.SKIP,
                texture: self.smaaEffect.renderTargetWeights.texture
            });

            const context = renderer.getContext();
            const samples = Math.max(4, context.getParameter(context.MAX_SAMPLES));
            self.composer.multisampling = samples;

            if (self.debug) self.csr.gui.setupAA(self.library, self.smaaEffect);

            self.composer.addPass(
                new self.library.EffectPass(
                    camera,
                    self.smaaEffect,
                    self.edgesTextureEffect,
                    self.weightsTextureEffect
                )
            );

            resolve();
        });
    });
};

/**
 * @ignore
 */
ripe.CSRPostProcess.prototype._setupAOPass = async function(normalPass, csr) {
    const depthDownsamplingPass = new this.library.DepthDownsamplingPass({
        normalBuffer: normalPass.texture,
        resolutionScale: 1
    });

    const normalDepthBuffer = this.composer.getRenderer().capabilities.isWebGL2
        ? depthDownsamplingPass.texture
        : null;

    const baseConfig = {
        blendFunction: this.library.BlendFunction.MULTIPLY,
        distanceScaling: false,
        depthAwareUpsampling: false,
        normalDepthBuffer,
        samples: 10,
        rings: 7,
        distanceThreshold: 1, // Render up to a distance of ~500 world units
        distanceFalloff: 0.0025, // with an additional ~2.5 units of falloff.
        rangeThreshold: 0.0003, // Occlusion proximity of ~0.3 world units
        rangeFalloff: 0.0001, // with ~0.1 units of falloff.
        luminanceInfluence: 0.7,
        minRadiusScale: 0.1,
        radius: 0.012,
        intensity: 100,
        bias: 0.0,
        fade: 0.01,
        color: null,
        resolutionScale: 1
    };

    this.ssaoTextureEffect = new this.library.TextureEffect({
        blendFunction: this.library.BlendFunction.SKIP,
        texture: depthDownsamplingPass.texture
    });

    this.ssaoEffect = new this.library.SSAOEffect(csr.camera, null, baseConfig);

    if (this.composer.getRenderer().capabilities.isWebGL2) {
        this.composer.addPass(depthDownsamplingPass);
    }

    this.customDepthPass = this.createCustomDepthPass(csr);
    this.composer.addPass(this.customDepthPass);

    this.composer.addPass(normalPass);

    const ssaoPass = new this.library.EffectPass(
        csr.camera,
        this.ssaoEffect,
        this.ssaoTextureEffect
    );
    this.composer.addPass(ssaoPass);

    this.ssaoTextureEffect.setTextureSwizzleRGBA(this.library.ColorChannel.ALPHA);

    this.ssaoTextureEffect.blendMode.setBlendFunction(this.library.BlendFunction.SKIP);

    ssaoPass.encodeOutput = false;
    depthDownsamplingPass.setDepthTexture(this.customDepthPass.texture);
    this.ssaoEffect.setDepthTexture(this.customDepthPass.texture);

    if (this.debug) {
        this.csr.gui.setupSSAO(this.ssaoEffect, depthDownsamplingPass, this.library);
    }
};

ripe.CSRPostProcess.prototype.createCustomDepthPass = function(csr) {
    const depthVertexShader = `
    #include <common>
    #include <uv_pars_vertex>
    #include <displacementmap_pars_vertex>
    #include <morphtarget_pars_vertex>
    #include <skinning_pars_vertex>
    #include <clipping_planes_pars_vertex>
    
    varying vec2 vHighPrecisionZW;
    
    void main() {
    
        #include <uv_vertex>
        #include <skinbase_vertex>
    
        #ifdef USE_DISPLACEMENTMAP
    
            #include <beginnormal_vertex>
            #include <morphnormal_vertex>
            #include <skinnormal_vertex>
    
        #endif
    
        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        #include <displacementmap_vertex>
        #include <project_vertex>
        #include <clipping_planes_vertex>
    
        vHighPrecisionZW = gl_Position.zw;
    
    }`;

    const depthFragmentShader = `
    #if DEPTH_PACKING == 3200
    
        uniform float opacity;
    
    #endif
    
    #include <common>
    #include <packing>
    #include <uv_pars_fragment>
    #include <map_pars_fragment>
    #include <alphamap_pars_fragment>
    #include <clipping_planes_pars_fragment>
    
    varying vec2 vHighPrecisionZW;
    
    void main() {
    
        #include <clipping_planes_fragment>
        vec4 diffuseColor = vec4(1.0);
    
        #if DEPTH_PACKING == 3200
    
            diffuseColor.a = opacity;
    
        #endif
    
        #include <map_fragment>
        #include <alphamap_fragment>
        #include <alphatest_fragment>
    
        // Higher precision equivalent of gl_FragCoord.z.
        float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
    
        #if DEPTH_PACKING == 3200
    
            gl_FragColor = vec4(vec3(1.0 - fragCoordZ), opacity);
    
        #elif DEPTH_PACKING == 3201
    
            gl_FragColor = packDepthToRGBA(fragCoordZ);
    
        #endif
    
    }`;

    class CustomDepthMaterial extends csr.library.ShaderMaterial {
        constructor(depthPacking = csr.library.RGBADepthPacking) {
            super({
                type: "CustomDepthMaterial",

                defines: {
                    DEPTH_PACKING: depthPacking.toFixed(0)
                },

                fragmentShader: depthFragmentShader,
                vertexShader: depthVertexShader
            });
        }
    }

    // override default renderpass material
    class CustomDepthPass extends this.library.DepthPass {
        constructor(scene, camera, options) {
            super(scene, camera, options);

            this.renderPass.overrideMaterial = new CustomDepthMaterial();
        }
    }

    return new CustomDepthPass(csr.scene, csr.camera);
};
