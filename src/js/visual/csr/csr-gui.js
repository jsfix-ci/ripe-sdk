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
 * @classdesc Class that defines the client side renderer that supports
 * the ConfiguratorCSR class. Stores and executes all logic for the
 * rendering, including loading meshes and materials, as well as setting
 * up the scene to be used.
 *
 * @param {ConfiguratorCSR} configurator The base configurator.
 * @param {Object} options The options to be used to configure the
 * renderer instance to be created.
 */
ripe.CSRGui = function(csr, options) {
    this.guiLib = options.dat === undefined ? null : options.dat;
    this.csr = csr;
};

ripe.CSRGui.prototype = ripe.build(ripe.Observable.prototype);
ripe.CSRGui.prototype.constructor = ripe.CSRGui;

/**
 * Creates the debug GUI for the post processing pipeline, with support
 * for dynamic change of the render pass parameters.
 */
ripe.CSRGui.prototype.setup = function() {
    if (this.guiLib === null) return;

    const self = this;

    this.gui = new this.guiLib.GUI({ width: 300 });

    this.gui.domElement.id = "gui";

    const updateShadows = (param, value) => {
        if (this.csr.keyLight) this.csr.keyLight.shadow[param] = value;
        if (this.csr.rimLight) this.csr.rimLight.shadow[param] = value;
        if (this.csr.fillLight) this.csr.fillLight.shadow[param] = value;
        this.csr.needsRenderUpdate = true;
    };

    const updateRenderer = (param, value) => {
        this.csr.renderer[param] = value;
        this.csr.needsRenderUpdate = true;
    };

    let folder = this.gui.addFolder("Camera Settings");
    folder
        .add(this.csr.camera, "near")
        .name("Near Plane")
        .min(0.1)
        .max(100)
        .step(0.1)
        .onChange(value => {
            self.csr.camera.near = value;
            self.csr.needsRenderUpdate = true;
        });

    folder
        .add(this.csr.camera, "far")
        .name("Far Plane")
        .min(0.01)
        .max(1000)
        .step(1)
        .onChange(value => {
            self.csr.camera.far = value;
            self.csr.needsRenderUpdate = true;
        });

    folder = this.gui.addFolder("Render Settings");
    folder
        .add(this.csr.renderer, "toneMappingExposure", 0.0, 4.0)
        .name("Exposure")
        .onChange(function(value) {
            updateRenderer("toneMappingExposure", value);
        });

    // if there are no lights, exit
    if (!this.csr.keyLight) {
        return;
    }

    folder
        .add(this.csr.keyLight.shadow, "bias", -0.005, 0.005)
        .step(0.0001)
        .name("Shadow Bias")
        .onChange(function(value) {
            updateShadows("bias", value);
        });
    folder
        .add(this.csr.keyLight.shadow, "radius", 1, 10)
        .step(1)
        .name("Shadow Radius")
        .onChange(function(value) {
            updateShadows("radius", value);
        });
    folder
        .add(this.csr, "_wireframe")
        .name("Enable Wireframe Mode")
        .onChange(function(value) {
            self.csr.updateWireframe(value);
            self.csr.needsRenderUpdate = true;
        });
};

ripe.CSRGui.prototype.setupBloom = function(bloomEffect) {
    const self = this;

    const folderBloom = this.gui.addFolder("Bloom Pass");

    folderBloom
        .add(bloomEffect.luminanceMaterial, "threshold", 0.0, 1.0)
        .step(0.01)
        .name("Threshold")
        .onChange(function(value) {
            bloomEffect.luminanceMaterial.threshold = value;
            self.csr.needsRenderUpdate = true;
        });
    folderBloom
        .add(bloomEffect, "intensity", 0.0, 3.0)
        .step(0.01)
        .name("Intensity")
        .onChange(function(value) {
            bloomEffect.intensity = value;
            self.csr.needsRenderUpdate = true;
        });
    folderBloom
        .add(bloomEffect.blendMode.opacity, "value", 0.0, 1.0)
        .step(0.01)
        .step(0.01)
        .name("Opacity")
        .onChange(function(value) {
            bloomEffect.blendMode.opacity.value = value;
            self.csr.needsRenderUpdate = true;
        });
};

ripe.CSRGui.prototype.setupAA = function(lib, aaEffect) {
    const folderAA = this.gui.addFolder("SMAA Pass");
    const edgeDetectionMaterial = aaEffect.edgeDetectionMaterial;

    const self = this;

    const SMAAMode = {
        DEFAULT: 0,
        SMAA_EDGES: 1,
        SMAA_WEIGHTS: 2
    };

    const params = {
        smaa: {
            mode: SMAAMode.DEFAULT,
            preset: lib.SMAAPreset.HIGH,
            opacity: aaEffect.blendMode.opacity.value,
            "blend mode": aaEffect.blendMode.blendFunction
        },
        edgeDetection: {
            mode: Number(edgeDetectionMaterial.defines.EDGE_DETECTION_MODE),
            "contrast factor": Number(
                edgeDetectionMaterial.defines.LOCAL_CONTRAST_ADAPTATION_FACTOR
            ),
            threshold: Number(edgeDetectionMaterial.defines.EDGE_THRESHOLD)
        },
        predication: {
            mode: Number(edgeDetectionMaterial.defines.PREDICATION_MODE),
            threshold: Number(edgeDetectionMaterial.defines.PREDICATION_THRESHOLD),
            strength: Number(edgeDetectionMaterial.defines.PREDICATION_STRENGTH),
            scale: Number(edgeDetectionMaterial.defines.PREDICATION_SCALE)
        }
    };

    folderAA.add(params.smaa, "preset", lib.SMAAPreset).onChange(() => {
        aaEffect.applyPreset(Number(params.smaa.preset));
        params.edgeDetection.threshold = Number(edgeDetectionMaterial.defines.EDGE_THRESHOLD);
        self.csr.needsRenderUpdate = true;
    });

    let subfolder = folderAA.addFolder("Edge Detection");

    subfolder.add(params.edgeDetection, "mode", lib.EdgeDetectionMode).onChange(() => {
        edgeDetectionMaterial.setEdgeDetectionMode(Number(params.edgeDetection.mode));
        self.csr.needsRenderUpdate = true;
    });

    subfolder
        .add(params.edgeDetection, "contrast factor")
        .min(1.0)
        .max(3.0)
        .step(0.01)
        .onChange(() => {
            edgeDetectionMaterial.setLocalContrastAdaptationFactor(
                Number(params.edgeDetection["contrast factor"])
            );
            self.csr.needsRenderUpdate = true;
        });

    subfolder
        .add(params.edgeDetection, "threshold")
        .min(0.0)
        .max(0.5)
        .step(0.0001)
        .onChange(() => {
            edgeDetectionMaterial.setEdgeDetectionThreshold(Number(params.edgeDetection.threshold));
            self.csr.needsRenderUpdate = true;
        })
        .listen();

    subfolder = folderAA.addFolder("Predicated Thresholding");

    subfolder.add(params.predication, "mode", lib.PredicationMode).onChange(() => {
        edgeDetectionMaterial.setPredicationMode(Number(params.predication.mode));
        self.csr.needsRenderUpdate = true;
    });

    subfolder
        .add(params.predication, "threshold")
        .min(0.0)
        .max(0.5)
        .step(0.0001)
        .onChange(() => {
            edgeDetectionMaterial.setPredicationThreshold(Number(params.predication.threshold));
            self.csr.needsRenderUpdate = true;
        });

    subfolder
        .add(params.predication, "strength")
        .min(0.0)
        .max(1.0)
        .step(0.0001)
        .onChange(() => {
            edgeDetectionMaterial.setPredicationStrength(Number(params.predication.strength));
            self.csr.needsRenderUpdate = true;
        });

    subfolder
        .add(params.predication, "scale")
        .min(1.0)
        .max(5.0)
        .step(0.01)
        .onChange(() => {
            edgeDetectionMaterial.setPredicationScale(Number(params.predication.scale));
            self.csr.needsRenderUpdate = true;
        });

    folderAA
        .add(params.smaa, "opacity")
        .min(0.0)
        .max(1.0)
        .step(0.01)
        .onChange(() => {
            aaEffect.blendMode.opacity.value = params.smaa.opacity;
            self.csr.needsRenderUpdate = true;
        });

    folderAA.add(params.smaa, "blend mode", lib.BlendFunction).onChange(() => {
        aaEffect.blendMode.setBlendFunction(Number(params.smaa["blend mode"]));
        self.csr.needsRenderUpdate = true;
    });
};

/**
 *  GUI configuration for the Screen-Space Ambient Occlusion pass.
 *
 * @param {*} ssaoEffect The effect itself.
 * @param {*} depthDownsamplingPass The downsampling pass for the depth buffer.
 * @param {*} library The postprocess library.
 */
ripe.CSRGui.prototype.setupSSAO = function(ssaoEffect, depthDownsamplingPass, library) {
    const self = this;

    const folderSSAO = this.gui.addFolder("SSAO Pass");
    const uniforms = ssaoEffect.ssaoMaterial.uniforms;

    const blendMode = ssaoEffect.blendMode;

    const params = {
        distance: {
            threshold: uniforms.distanceCutoff.value.x,
            falloff: uniforms.distanceCutoff.value.y - uniforms.distanceCutoff.value.x
        },
        proximity: {
            threshold: uniforms.proximityCutoff.value.x,
            falloff: uniforms.proximityCutoff.value.y - uniforms.proximityCutoff.value.x
        },
        upsampling: {
            enabled: ssaoEffect.defines.has("DEPTH_AWARE_UPSAMPLING"),
            threshold: Number(ssaoEffect.defines.get("THRESHOLD"))
        },
        "lum influence": ssaoEffect.uniforms.get("luminanceInfluence").value,
        intensity: uniforms.intensity.value,
        bias: uniforms.bias.value,
        fade: uniforms.fade.value,
        resolution: ssaoEffect.resolution.scale,
        color: 0x000000,
        opacity: blendMode.opacity.value,
        "blend mode": blendMode.blendFunction
    };

    folderSSAO
        .add(ssaoEffect, "samples")
        .min(1)
        .max(32)
        .step(1)
        .onChange(() => {
            self.csr.needsRenderUpdate = true;
        });

    folderSSAO
        .add(ssaoEffect, "rings")
        .min(1)
        .max(16)
        .step(1)
        .onChange(() => {
            self.csr.needsRenderUpdate = true;
        });

    folderSSAO
        .add(ssaoEffect, "radius")
        .min(1e-6)
        .max(1.0)
        .step(0.001)
        .onChange(() => {
            self.csr.needsRenderUpdate = true;
        });

    folderSSAO
        .add(params, "resolution")
        .min(0.25)
        .max(1.0)
        .step(0.25)
        .onChange(() => {
            ssaoEffect.resolution.scale = params.resolution;
            depthDownsamplingPass.resolution.scale = params.resolution;
            self.csr.needsRenderUpdate = true;
        });

    let f = folderSSAO.addFolder("Distance Cutoff");

    f.add(params.distance, "threshold")
        .min(0.0)
        .max(1.0)
        .step(0.0001)
        .onChange(() => {
            ssaoEffect.setDistanceCutoff(params.distance.threshold, params.distance.falloff);
            self.csr.needsRenderUpdate = true;
        });

    f.add(params.distance, "falloff")
        .min(0.0)
        .max(1.0)
        .step(0.0001)
        .onChange(() => {
            ssaoEffect.setDistanceCutoff(params.distance.threshold, params.distance.falloff);
            self.csr.needsRenderUpdate = true;
        });

    f = folderSSAO.addFolder("Proximity Cutoff");

    f.add(params.proximity, "threshold")
        .min(0.0)
        .max(0.01)
        .step(0.0001)
        .onChange(() => {
            ssaoEffect.setProximityCutoff(params.proximity.threshold, params.proximity.falloff);
            self.csr.needsRenderUpdate = true;
        });

    f.add(params.proximity, "falloff")
        .min(0.0)
        .max(0.01)
        .step(0.0001)
        .onChange(() => {
            ssaoEffect.setProximityCutoff(params.proximity.threshold, params.proximity.falloff);
            self.csr.needsRenderUpdate = true;
        });

    folderSSAO
        .add(params, "bias")
        .min(0.0)
        .max(1.0)
        .step(0.001)
        .onChange(() => {
            uniforms.bias.value = params.bias;
            self.csr.needsRenderUpdate = true;
        });

    folderSSAO
        .add(params, "fade")
        .min(0.0)
        .max(1.0)
        .step(0.001)
        .onChange(() => {
            uniforms.fade.value = params.fade;
            self.csr.needsRenderUpdate = true;
        });

    folderSSAO
        .add(params, "lum influence")
        .min(0.0)
        .max(1.0)
        .step(0.001)
        .onChange(() => {
            ssaoEffect.uniforms.get("luminanceInfluence").value = params["lum influence"];
            self.csr.needsRenderUpdate = true;
        });

    folderSSAO
        .add(params, "intensity")
        .min(1.0)
        .max(4.0)
        .step(0.01)
        .onChange(() => {
            uniforms.intensity.value = params.intensity;
            self.csr.needsRenderUpdate = true;
        });

    const ssaoColor = new this.csr.library.Color(0, 0, 0);

    folderSSAO.addColor(params, "color").onChange(() => {
        ssaoEffect.color =
            params.color === 0x000000 ? null : ssaoColor.setHex(params.color).convertSRGBToLinear();
        self.csr.needsRenderUpdate = true;
    });

    folderSSAO
        .add(params, "opacity")
        .min(0.0)
        .max(1.0)
        .step(0.001)
        .onChange(() => {
            blendMode.opacity.value = params.opacity;
            self.csr.needsRenderUpdate = true;
        });

    folderSSAO.add(params, "blend mode", library.BlendFunction).onChange(() => {
        blendMode.setBlendFunction(Number(params["blend mode"]));
        self.csr.needsRenderUpdate = true;
    });
};
