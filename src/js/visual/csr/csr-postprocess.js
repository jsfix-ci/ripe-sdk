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
