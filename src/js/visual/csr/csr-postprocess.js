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
    this.postProcessLib = options.postProcessingLibrary;
    this._setPostProcessOptions(options);
};

ripe.CSRPostProcess.prototype = ripe.build(ripe.Observable.prototype);
ripe.CSRPostProcess.prototype.constructor = ripe.CSRPostProcess;

ripe.CSRPostProcess.prototype.updateOptions = async function(options) {
    this.postProcessLib =
        options.postProcessingLibrary === undefined
            ? this.postProcessLib
            : options.postProcessingLibrary;
    this.postProcessing =
        options.postProcessing === undefined ? this.postProcessing : options.postProcessing;
}

/**
 * Creates the render passes and adds them to the effect composer.
 */
ripe.CSRPostProcess.prototype.setup = async function () {
    this.composer = new this.postProcessLib.EffectComposer(this.csr.renderer);
    this.composer.addPass(new this.postProcessLib.RenderPass(this.csr.scene, this.csr.camera));

    await this._setupBloomPass();
    await this._setupAAPass();
    await this._setupAOPass();
}

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
ripe.CSRPostProcess.prototype._setupBloomPass = async function() {
    const blendFunction = this.postProcessLib.BlendFunction.SCREEN;
    const kernelSize = this.postProcessLib.KernelSize.MEDIUM;
    const luminanceSmoothing = 0.075;
    const bloomHeight = 480;

    const baseBloomConfig = {
        blendFunction: blendFunction,
        kernelSize: kernelSize,
        luminanceSmoothing: luminanceSmoothing,
        height: bloomHeight
    };

    const bloomEffect = new this.postProcessLib.BloomEffect(baseBloomConfig);

    bloomEffect.luminanceMaterial.threshold =
        this.bloomOptions.threshold === undefined ? 0.9 : this.bloomOptions.threshold;
    bloomEffect.intensity =
        this.bloomOptions.intensity === undefined ? 0.5 : this.bloomOptions.intensity;
    bloomEffect.blendMode.opacity.value =
        this.bloomOptions.opacity === undefined ? 0.7 : this.bloomOptions.opacity;

    this.composer.addPass(new this.postProcessLib.EffectPass(this.camera, bloomEffect));

    if (this.debug) this.csr.gui.setupBloom(bloomEffect);
};

/**
 * @ignore
 */
ripe.CSRPostProcess.prototype._setupAAPass = async function() {
    const loadingManager = new this.csr.library.LoadingManager();
    const smaaImageLoader = new this.postProcessLib.SMAAImageLoader(loadingManager);

    const self = this;

    smaaImageLoader.load(([search, area]) => {
        const aaEffect = new this.postProcessLib.SMAAEffect(
            search,
            area,
            self.postProcessLib.SMAAPreset.HIGH,
            self.postProcessLib.EdgeDetectionMode.COLOR
        );

        // the following variables are used in
        // the debug GUI (for the CSR)
        const edgesTextureEffect = new this.postProcessLib.TextureEffect({
            blendFunction: self.postProcessLib.BlendFunction.SKIP,
            texture: aaEffect.renderTargetEdges.texture
        });

        const weightsTextureEffect = new this.postProcessLib.TextureEffect({
            blendFunction: self.postProcessLib.BlendFunction.SKIP,
            texture: aaEffect.renderTargetWeights.texture
        });

        const effectPass = new this.postProcessLib.EffectPass(
            self.camera,
            aaEffect,
            edgesTextureEffect,
            weightsTextureEffect
        );

        self.composer.addPass(effectPass);

        const context = self.csr.renderer.getContext();
        const samples = Math.max(4, context.getParameter(context.MAX_SAMPLES));
        self.composer.multisampling = samples;

        if (self.debug) self.gui.setupAA(self.postProcessLib, aaEffect);

        // update image to include antialiasing
        self.needsRenderUpdate = true;
    });
};

/**
 * @ignore
 */
ripe.CSRPostProcess.prototype._setupAOPass = async function() {};
