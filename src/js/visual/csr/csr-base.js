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
 * @param {Object} owner The owner (customizer instance) for
 * this configurator.
 * @param {Object} element The DOM element in which the renderer will
 * render to.
 * @param {Object} options The options to be used to configure the
 * renderer instance to be created.
 */
ripe.CSR = function(owner, element, options) {
    this.owner = owner;
    this.type = this.type || "CSR";
    this.element = element;

    this.library = options.library;

    // sets the default configurations
    this.cameraFOV = 20;
    this.cameraHeight = 0;
    this.cameraTarget = new this.library.Vector3(0, 0, 0);
    this.initialDistance = 100;

    this._setCameraOptions(options);

    // sets the default render options
    this.easing = this.materialEasing = this.crossfadeEasing = this.highlightEasing =
        "easeInOutQuad";
    this.environment = "";
    this.noMasks = false;
    this.useMasks = true;
    this.maskOpacity = 0.4;
    this.maskDuration = 150;
    this.animation = "";
    this.playsAnimation = true;
    this.animationLoops = true;
    this._setRenderOptions(options);

    this.shadowBias = 0;
    this.exposure = 1.5;
    this.radius = 1;
    this.postProcessing = options.postProcessing === undefined ? true : options.postProcessing;

    this.usesScene = options.assets.scene !== undefined;
    this.postProcessLib = options.postProcessingLibrary;
    this._setPostProcessOptions(options);

    this.partsMap = options.partsMap || {};

    // starts the raycasting related values
    this.intersectedPart = null;

    this.debug = options.debug || false;

    this.boundingBox = undefined;

    this._wireframe = false;
    this.raycastStrategy = options.raycastStrategy === undefined ? "gpu" : options.raycastStrategy;

    this.enableRaycastAnimation =
        options.enableRaycastAnimation === undefined ? false : options.enableRaycastAnimation;
    this.gui = new ripe.CSRGui(this, options);

    this.scene = new this.library.Scene();
};

ripe.CSR.prototype = ripe.build(ripe.Observable.prototype);
ripe.CSR.prototype.constructor = ripe.CSR;

/**
 * Updates configurator current options with the ones provided, called from the Configurator
 * instance.
 *
 * @param {Object} options Set of optional parameters to adjust the renderer.
 */
ripe.CSR.prototype.updateOptions = async function(options) {
    this.assetManager.updateOptions(options);

    this._setCameraOptions(options);
    this._setRenderOptions(options);

    this.width = options.width === undefined ? this.width : options.width;
    this.element = options.element === undefined ? this.element : options.element;
    this.library = options.library === undefined ? this.library : options.library;
    this.postProcessLib =
        options.postProcessingLibrary === undefined
            ? this.postProcessLib
            : options.postProcessingLibrary;
    this.postProcessing =
        options.postProcessing === undefined ? this.postProcessing : options.postProcessing;
};

/**
 * Called from the Configurator instance to initialize all aspects related to rendering,
 * such as creating the scene, adding the loaded meshes, etc.
 *
 * @param {CSRAssetManager} assetManager
 */
ripe.CSR.prototype.initialize = async function(assetManager) {
    this.assetManager = assetManager;

    this._createLoops();
    this._initializeLights();
    this._initializeCameras();
    this._initializeRenderer();
    this._registerHandlers();
    this._initializeShaders();
    this._initializeRaycaster();

    // triggers the loading of the remote assets that are going
    // to be used in scene initialization
    await this._loadAssets();

    if (this.debug) this.gui.setup();

    // in case post processing is required runs the setup process
    // for it, this may take several time to finish and may use
    // web artifact like web workers for its execution
    if (this.postProcessing) await this._setupPostProcessing();

    if (this.playsAnimation) {
        // in case were meant to execute an animation bt there's none
        // available raises an exception
        if (this.animation && this._getAnimationByName(this.animation) === undefined) {
            throw new Error(
                `There is no animation present in the file with the given name '${this.introAnimation}'`
            );
        }

        // if specific animation is requested, check if it exists
        const hasAnimation =
            this.animation && this._getAnimationByName(this.animation) !== undefined;

        // specific animation exists, play it
        if (hasAnimation) {
            this._performAnimation(this.animation);
            return;
        }

        // try find the first animation it can find, otherwise, it's not
        // able to play any animation, and just renders directly
        if (this.assetManager.animations.size > 0) {
            const animationsIterator = this.assetManager.animations.entries();
            const animation = animationsIterator.next().value[0];

            this._performAnimation(animation);
            return;
        }
    }

    // no animation was found, render scene normally
    this.needsRenderUpdate = true;
};

/**
 * Creates the raycaster to be used on the scene depending on whether
 * CPU or GPU picking is selected.
 */
ripe.CSR.prototype._initializeRaycaster = function() {
    // coordinates vary if using GPU or CPU picking
    switch (this.raycastStrategy) {
        case "cpu":
            this.raycaster = new this.library.Raycaster();
            break;
        case "gpu":
        default:
            // GPU Picker requires all the base structures for the CSR to
            // be initialized
            this.raycaster = new ripe.CSRGPUPicker(this);
            break;
    }
};

/**
 * Creates custom render and raycasting loops for increased performance.
 * For the render loop, only render when specifically told to update,
 * for the raycasting loop, only raycast when mouse event was registered,
 * and after a certain threshold of time has passed since the previous
 * raycast operation.
 */
ripe.CSR.prototype._createLoops = function() {
    this.needsRenderUpdate = false;
    this.forceStopRender = false;

    this.renderLoop = () => {
        if (this.needsRenderUpdate && !this.forceStopRender) {
            this.composer.render();
        }

        this.needsRenderUpdate = false;

        requestAnimationFrame(this.renderLoop);
    };

    this.raycastClock = new this.library.Clock();
    this.raycastClock.start();
    this.needsRaycastUpdate = false;
    this.raycastEvent = null;
    // number of seconds separating each call to trigger a raycast
    this.raycastThreshold = 0.1;

    this.raycastLoop = () => {
        // time the last "getDelta" was called
        const previousTime = this.raycastClock.oldTime;
        const delta = this.raycastClock.getDelta();

        const canRaycast =
            this.raycastEvent &&
            delta > this.raycastThreshold &&
            !this.element.classList.contains("no-raycast");

        if (canRaycast) {
            this._attemptRaycast(this.raycastEvent);
            this.raycastEvent = null;
        } else {
            // if no raycast was made, reset the old time to
            // not take into account the latest "getDelta"
            this.raycastClock.oldTime = previousTime;
        }

        requestAnimationFrame(this.raycastLoop);
    };

    // begin render loop
    requestAnimationFrame(this.renderLoop);
    // begin raycast loop for increased performance
    requestAnimationFrame(this.raycastLoop);
};

/**
 * Function to dispose all resources created by the renderer,
 * including all the elements belonging to the scene.
 */
ripe.CSR.prototype.disposeResources = async function() {
    this.renderer.renderLists.dispose();
    for (const program of this.renderer.info.programs) {
        program.destroy();
    }

    this.renderer.info.reset();

    this.renderer.dispose();
    this.renderer = null;
    this.composer = null;

    if (this.keyLight.shadow && this.keyLight.shadow.map) this.keyLight.shadow.map.dispose();
    if (this.fillLight.shadow && this.fillLight.shadow.map) this.fillLight.shadow.map.dispose();
    if (this.rimLight.shadow && this.rimLight.shadow.map) this.rimLight.shadow.map.dispose();

    this.previousSceneFBO.texture.dispose();
    this.previousSceneFBO.dispose();
    this.nextSceneFBO.texture.dispose();
    this.nextSceneFBO.dispose();

    await this.assetManager.disposeScene(this.scene);
};

ripe.CSR.prototype.updateWireframe = function(value) {
    Object.values((this.assetManager && this.assetManager.meshes) || {}).forEach(mesh => {
        mesh.material.wireframe = value;

        if (value) {
            mesh.castShadow = false;
            mesh.receiveShadow = false;
        } else {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
    });

    this._wireframe = value;
};
/**
 * Responsible for updating the initials meshes in the scene.
 *
 * @param {String} operation Can be "remove" or "add", to either destroy the meshes from the scene,
 * or add them.
 * @param {Array} meshes The target meshes that will be modified.
 */
ripe.CSR.prototype.updateInitials = function(operation, meshes) {
    for (let i = 0; i < meshes.length; i++) {
        if (operation === "remove") {
            this.scene.remove(meshes[i]);
        }

        if (operation === "add") {
            this.scene.add(meshes[i]);
        }
    }
};

/**
 * @ignore
 */
ripe.CSR.prototype.updateSize = function() {
    if (this.renderer) this.renderer.setSize(this.element.clientWidth, this.element.clientHeight);
    if (this.composer) this.composer.setSize(this.element.clientWidth, this.element.clientHeight);
};

/**
 * The highlight operation for a part.
 *
 * @param {String} part The name of the part that is the target
 * for the highlight.
 */
ripe.CSR.prototype.highlight = function(part) {
    // verifiers if masks are meant to be used for the current model
    // and if that's not the case returns immediately
    if (!this.useMasks && this.noMasks) {
        return;
    }

    const material = part.material;
    const r = this.assetManager.partsColors[material.uuid][0] * (1 - this.maskOpacity);
    const g = this.assetManager.partsColors[material.uuid][1] * (1 - this.maskOpacity);
    const b = this.assetManager.partsColors[material.uuid][2] * (1 - this.maskOpacity);

    const targetColor = new this.library.Color(r, g, b);

    // changes the highlight (opacity) value for the part that is going
    // to be highlighted (uses animation for such operation)
    this.changeHighlight(part, targetColor);

    // triggers an event indicating that a highlight operation has been
    // performed on the current configurator
    this.trigger("highlighted");
};

/**
 * The lowlight operation. Uses the current intersected part, and removes it.
 */
ripe.CSR.prototype.lowlight = function() {
    // verifiers if masks are meant to be used for the current model
    // and if that's not the case returns immediately
    if (!this.useMasks && this.noMasks) {
        return;
    }

    // in case there's no intersected part selected then
    // returns the control flow immediately (nothing to be done)
    if (this.intersectedPart === null) {
        return;
    }

    const material = this.intersectedPart.material;

    const r = this.assetManager.partsColors[material.uuid][0];
    const g = this.assetManager.partsColors[material.uuid][1];
    const b = this.assetManager.partsColors[material.uuid][2];

    const targetColor = new this.library.Color(r, g, b);

    this.changeHighlight(this.intersectedPart, targetColor);

    // unsets the intersected part value
    this.intersectedPart = null;

    // triggers an event indicating that a lowlight operation has been
    // performed on the current configurator
    this.trigger("lowlighted");
};

/**
 * Changes the highlight value for a certain part's mesh.
 *
 * The changing itself will be animated using a cross-fade animation.
 *
 * @param {Mesh} part The mesh of the affected part.
 * @param {Number} endValue The end value for the material color, determined by the
 * caller.
 */
ripe.CSR.prototype.changeHighlight = function(part, endColor) {
    const startR = part.material.color.r;
    const startG = part.material.color.g;
    const startB = part.material.color.b;

    let currentR = startR;
    let currentG = startG;
    let currentB = startB;

    let pos = 0;
    let startTime = 0;

    const changeHighlightTransition = time => {
        startTime = startTime === 0 ? time : startTime;

        part.material.color.r = currentR;
        part.material.color.g = currentG;
        part.material.color.b = currentB;

        pos = (time - startTime) / this.maskDuration;

        currentR = ripe.easing[this.highlightEasing](pos, startR, endColor.r);
        currentG = ripe.easing[this.highlightEasing](pos, startG, endColor.g);
        currentB = ripe.easing[this.highlightEasing](pos, startB, endColor.b);

        if (pos <= 1) {
            this.needsRenderUpdate = true;
            requestAnimationFrame(changeHighlightTransition);
        } else {
            this.needsRenderUpdate = false;
            if (this.element.classList.contains("no-raycast")) {
                this.element.classList.remove("no-raycast");
            }
        }
    };

    requestAnimationFrame(changeHighlightTransition);
};

/**
 * The crossfade function, that handles rendering the first image, then the image after the change
 * and seamlessly transitions between the two images.
 *
 * @param {Object} options Specific options for the transition, such as duration and the new materials.
 * @param {String} type The type of transition, can be "rotation" for changing views or positions,
 * or "material" when the "setParts" function is called.
 */
ripe.CSR.prototype.crossfade = async function(options = {}, type) {
    const parts = options.parts === undefined ? this.owner.parts : options.parts;

    const width = this.element.getBoundingClientRect().width;
    const height = this.element.getBoundingClientRect().height;

    const isCrossfading = this.element.classList.contains("crossfading");

    let mixRatio = 0.0;

    // creates the quad from buffer mesh for the viewport and then a quad
    // associated with the crossfade shader, setting the quad in the range
    // the crossfade camera can render
    const quadGeometry = new this.library.PlaneBufferGeometry(width, height);
    const quad = new this.library.Mesh(quadGeometry, this.crossfadeShader);
    quad.position.set(0, 0, 999);
    this.scene.add(quad);

    if (isCrossfading) {
        // since it is already in crossfade, only begin the transition to the next frame
        // after the materials are loaded
        if (type === "material") await this.assetManager.setMaterials(parts, false);
    }

    // renders current state
    this.renderer.setRenderTarget(this.previousSceneFBO);
    this.renderer.clear();

    // stop current rendering
    this.forceStopRender = true;

    if (!isCrossfading || type === "rotation") this.renderer.render(this.scene, this.camera);

    // performs the change
    if (type === "material") {
        if (!isCrossfading) await this.assetManager.setMaterials(parts);
        else {
            // now that the textures are loaded, render the current scene, and only then send the
            // stop-crossfade message and render
            this.renderer.render(this.scene, this.camera);
            this.element.classList.add("stop-crossfade");

            // setting materials is now much faster since textures have already been loaded,
            // resulting in less visible stutter for the user
            await this.assetManager.setMaterials(parts, true);
        }
    } else if (type === "rotation") {
        this.rotate(options);
    }

    // updates the wireframe to match between cross-fades
    this.updateWireframe(this._wireframe);

    // renders the scene after the change
    this.renderer.setRenderTarget(this.nextSceneFBO);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    // resets renderer
    this.renderer.setRenderTarget(null);
    this.renderer.clear();

    this.crossfadeShader.uniforms.tDiffuse1.value = this.previousSceneFBO.texture;
    this.crossfadeShader.uniforms.tDiffuse2.value = this.nextSceneFBO.texture;

    this.crossfadeShader.uniforms.mixRatio.value = mixRatio;

    const duration = options.duration || 500;

    let pos = 0;
    let startTime = 0;
    let continueCrossfade = true;

    const crossfadeFunction = time => {
        startTime = startTime === 0 ? time : startTime;

        continueCrossfade = pos < 1 && !this.element.classList.contains("stop-crossfade");

        if (!continueCrossfade) {
            this.assetManager.disposeMesh(quad);
            this.scene.remove(quad);
            this.element.classList.remove("animating");
            this.element.classList.remove("no-drag");
            this.element.classList.remove("crossfading");

            this.previousSceneFBO.texture.dispose();
            this.nextSceneFBO.texture.dispose();

            if (this.element.classList.contains("stop-crossfade")) {
                this.element.classList.remove("stop-crossfade");
            }

            quadGeometry.dispose();

            this.assetManager.disposeMesh(quad);

            // renders scene with composer
            this.forceStopRender = false;

            return;
        }

        pos = (time - startTime) / duration;
        mixRatio = ripe.easing[this.crossfadeEasing](pos, 0.0, 1.0);

        this.crossfadeShader.uniforms.mixRatio.value = mixRatio;

        this.renderer.render(this.scene, this.crossfadeCamera);

        requestAnimationFrame(crossfadeFunction);
    };

    this.element.classList.add("animating");
    this.element.classList.add("no-drag");
    this.element.classList.add("crossfading");

    requestAnimationFrame(crossfadeFunction);
};

/**
 * Applies the rotation to the scene camera, as the rotation values are controlled by the
 * Orbital Controls.
 *
 * @param {Object} options The struct containing the new values for rotation and camera distance.
 */
ripe.CSR.prototype.rotate = function(options) {
    const maxHeight = options.distance - this.cameraHeight;

    const distance = options.distance * Math.cos((Math.PI / 180) * options.rotationY);
    this.camera.position.x = distance * Math.sin((Math.PI / 180) * options.rotationX * -1);
    this.camera.position.y =
        this.cameraHeight + maxHeight * Math.sin((Math.PI / 180) * options.rotationY);
    this.camera.position.z = distance * Math.cos((Math.PI / 180) * options.rotationX);

    this.camera.lookAt(this.cameraTarget);
    this.needsRenderUpdate = true;
};

ripe.CSR.prototype._setCameraOptions = function(options = {}) {
    if (!options.camera) return;

    const camOptions = options.camera;

    this.cameraFOV = camOptions.fov === undefined ? this.cameraFOV : camOptions.fov;
    this.cameraHeight = camOptions.height === undefined ? this.cameraHeight : camOptions.height;
    this.cameraTarget =
        camOptions.target === undefined
            ? this.cameraTarget
            : new this.library.Vector3(
                  camOptions.target.x,
                  camOptions.target.y,
                  camOptions.target.z
              );

    this.initialDistance = camOptions.distance;
};

ripe.CSR.prototype._setRenderOptions = function(options = {}) {
    if (!options.renderer) return;

    const renderOptions = options.renderer;

    this.easing = renderOptions.easing === undefined ? this.easing : renderOptions.easing;
    this.materialEasing =
        renderOptions.materialEasing === undefined
            ? this.materialEasing
            : renderOptions.materialEasing;
    this.crossfadeEasing =
        renderOptions.crossfadeEasing === undefined
            ? this.crossfadeEasing
            : renderOptions.crossfadeEasing;
    this.highlightEasing =
        renderOptions.highlightEasing === undefined
            ? this.highlightEasing
            : renderOptions.highlightEasing;

    this.environment =
        renderOptions.environment === undefined ? this.environment : renderOptions.environment;
    this.noMasks = renderOptions.noMasks === undefined ? this.noMasks : renderOptions.noMasks;
    this.useMasks = renderOptions.useMasks === undefined ? this.useMasks : renderOptions.useMasks;
    this.maskOpacity =
        renderOptions.maskOpacity === undefined ? this.maskOpacity : renderOptions.maskOpacity;
    this.maskDuration =
        renderOptions.maskDuration === undefined ? this.maskDuration : renderOptions.maskDuration;

    this.introAnimation =
        renderOptions.introAnimation === undefined
            ? this.introAnimation
            : renderOptions.introAnimation;

    this.playsAnimation =
        renderOptions.playsAnimation === undefined
            ? this.playsAnimation
            : renderOptions.playsAnimation;
    this.animationLoops =
        renderOptions.animationLoops === undefined
            ? this.animationLoops
            : renderOptions.animationLoops;
    this.animation =
        renderOptions.animation === undefined ? this.animation : renderOptions.animation;
};

ripe.CSR.prototype._setPostProcessOptions = function(options = {}) {
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
ripe.CSR.prototype._registerHandlers = function() {
    const self = this;
    const area = this.element.querySelector(".area");

    area.addEventListener("mousedown", function(event) {
        const animating = self.element.classList.contains("animating");
        if (animating) return;

        self.down = true;
    });

    area.addEventListener("mouseout", function(event) {
        self.lowlight();
        self.down = false;
    });

    area.addEventListener("mouseup", function(event) {
        self.down = false;
    });

    area.addEventListener("mousemove", function(event) {
        // fixes the event, by applying a extra level of
        // compatibility on top of the base event structure
        event = ripe.fixEvent(event);

        // in case the index that was found is the zero one this is a special
        // position and the associated operation is the removal of the highlight
        // also if the target is being dragged the highlight should be removed
        if (self.down === true) {
            self.lowlight();
            return;
        }

        self.raycastEvent = event;
    });

    area.addEventListener("click", function(event) {
        event = ripe.fixEvent(event);

        if (!self.element.classList.contains("drag")) self.raycastEvent = event;
    });

    window.onresize = () => {
        this.boundingBox = this.element.getBoundingClientRect();
    };
};

/**
 * After the Asset Manager finished loading the glTF file, begin loading the necessary assets
 * that pertain to rendering, such as loading the environment and the animations.
 */
ripe.CSR.prototype._loadAssets = async function() {
    if (this.scene) {
        this.mixer = new this.library.AnimationMixer(this.scene);
    }

    if (this.environment) {
        await this.assetManager.setupEnvironment(this.scene, this.renderer, this.environment);
    }
};

/**
 * Initialize shaders that the renderer will use, such as
 * the crossfade shader for the transition.
 *
 * This shaders are defined in GLSL.
 *
 * @see https://en.wikipedia.org/wiki/OpenGL_Shading_Language
 */
ripe.CSR.prototype._initializeShaders = function() {
    this.crossfadeShader = new this.library.ShaderMaterial({
        uniforms: {
            tDiffuse1: {
                type: "t",
                value: null
            },
            tDiffuse2: {
                type: "t",
                value: null
            },
            mixRatio: {
                type: "f",
                value: 0.0
            }
        },
        vertexShader: [
            "varying vec2 vUv;",

            "void main() {",

            "     vUv = vec2( uv.x, uv.y );",
            "     gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "}"
        ].join("\n"),
        fragmentShader: [
            "uniform float mixRatio;",

            "uniform sampler2D tDiffuse1;",
            "uniform sampler2D tDiffuse2;",

            "varying vec2 vUv;",

            "void main() {",

            "    vec4 texel1 = texture2D( tDiffuse1, vUv );",
            "    vec4 texel2 = texture2D( tDiffuse2, vUv );",

            "    gl_FragColor = mix( texel1, texel2, mixRatio );",

            "}"
        ].join("\n")
    });
};

/**
 * Initializes the lights, taking into account the possible shadow bias and radius settings
 * passed to the Configurator.
 */
ripe.CSR.prototype._initializeLights = function() {
    const ambientLight = new this.library.HemisphereLight(0xffeeb1, 0x080820, 0.0);

    // lights should be further away based on the camera distance, useful for dealing
    // with scenes of varying sizes.
    const mult = this.initialDistance;

    this.keyLight = new this.library.PointLight(0xffffff, 0.5, 9 * mult);
    this.keyLight.position.set(1 * mult, 1 * mult, 1 * mult);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.radius = this.radius;
    this.keyLight.shadow.bias = this.shadowBias;

    this.fillLight = new this.library.PointLight(0xffffff, 0.2, 9 * mult);
    this.fillLight.position.set(-1 * mult, 0.5 * mult, 1 * mult);
    this.fillLight.castShadow = true;
    this.fillLight.shadow.mapSize.width = 1024;
    this.fillLight.shadow.mapSize.height = 1024;
    this.fillLight.shadow.radius = this.radius;
    this.fillLight.shadow.bias = this.shadowBias;

    this.rimLight = new this.library.PointLight(0xffffff, 0.7, 9 * mult);
    this.rimLight.position.set(-0.5 * mult, 0.75 * mult, -1.5 * mult);
    this.rimLight.castShadow = true;
    this.rimLight.shadow.mapSize.width = 1024;
    this.rimLight.shadow.mapSize.height = 1024;
    this.rimLight.shadow.radius = this.radius;
    this.rimLight.shadow.bias = this.shadowBias;

    this.scene.add(ambientLight);
    this.scene.add(this.keyLight);
    this.scene.add(this.fillLight);
    this.scene.add(this.rimLight);
};

/**
 * Initializes both the WebGL Renderer as well as the Effect Composer if it uses post-processing.
 */
ripe.CSR.prototype._initializeRenderer = function() {
    // creates the renderer using the "default" WebGL approach
    // notice that the shadow map is enabled
    this.renderer = new this.library.WebGLRenderer({
        logarithmicDepthBuffer: true,
        antialias: false,
        stencil: false,
        depth: true,
        alpha: true,
        physicallyCorrectLights: true
    });

    const width = this.element.getBoundingClientRect().width;
    const height = this.element.getBoundingClientRect().height;

    this.renderer.setSize(width, height);

    // sets renderer params
    this.renderer.toneMappingExposure = this.exposure;
    this.renderer.toneMapping = this.library.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.library.PCFSoftShadowMap;
    this.renderer.outputEncoding = this.library.sRGBEncoding;

    const area = this.element.querySelector(".area");
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setClearColor(0xffffff);

    area.appendChild(this.renderer.domElement);

    const renderTargetParams = {
        minFilter: this.library.LinearFilter,
        magFilter: this.library.LinearFilter,
        format: this.library.RGBAFormat
    };

    this.previousSceneFBO = new this.library.WebGLRenderTarget(width, height, renderTargetParams);
    this.nextSceneFBO = new this.library.WebGLRenderTarget(width, height, renderTargetParams);

    this.composer = new this.postProcessLib.EffectComposer(this.renderer);
    this.composer.addPass(new this.postProcessLib.RenderPass(this.scene, this.camera));
};

/**
 * Creates the render passes and adds them to the effect composer.
 */
ripe.CSR.prototype._setupPostProcessing = async function() {
    await this._setupBloomPass();
    await this._setupAAPass();
    await this._setupAOPass();
};

/**
 * @ignore
 */
ripe.CSR.prototype._setupBloomPass = async function() {
    const blendFunction = this.postProcessLib.BlendFunction.SCREEN;
    const kernelSize = this.postProcessLib.KernelSize.MEDIUM;
    const luminanceSmoothing = 0.075;
    const bloomHeight = 480;

    const bloomOptions = {
        blendFunction: blendFunction,
        kernelSize: kernelSize,
        luminanceSmoothing: luminanceSmoothing,
        height: bloomHeight
    };

    const bloomEffect = new this.postProcessLib.BloomEffect(bloomOptions);

    bloomEffect.luminanceMaterial.threshold =
        this.bloomOptions.threshold === undefined ? 0.9 : this.bloomOptions.threshold;
    bloomEffect.intensity =
        this.bloomOptions.intensity === undefined ? 0.5 : this.bloomOptions.intensity;
    bloomEffect.blendMode.opacity.value =
        this.bloomOptions.opacity === undefined ? 0.7 : this.bloomOptions.opacity;

    this.composer.addPass(new this.postProcessLib.EffectPass(this.camera, bloomEffect));

    if (this.debug) this.gui.setupBloom(bloomEffect);
};

/**
 * @ignore
 */
ripe.CSR.prototype._setupAAPass = async function() {
    const loadingManager = new this.library.LoadingManager();
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

        const context = self.renderer.getContext();
        const samples = Math.max(4, context.getParameter(context.MAX_SAMPLES));
        self.composer.multisampling = samples;

        if (self.debug) self.gui.setupAA(self.postProcessLib, aaEffect);
    });
};

/**
 * @ignore
 */
ripe.CSR.prototype._setupAOPass = async function() {};

/**
 * Creates the default camera as well as the camera that will be responsible
 * for handling the crossfading.
 */
ripe.CSR.prototype._initializeCameras = function() {
    const width = this.element.getBoundingClientRect().width;
    const height = this.element.getBoundingClientRect().height;

    this.camera = new this.library.PerspectiveCamera(this.cameraFOV, width / height, 0.01, 1000);
    this.camera.position.set(0, this.cameraHeight, this.initialDistance);

    if (this.element.dataset.view === "side") {
        this._currentVerticalRot = 0;
        this.verticalRot = 0;
    } else if (this.element.dataset.view === "top") {
        this._currentVerticalRot = Math.PI / 2;
        this.verticalRot = Math.PI / 2;
    }

    this.camera.lookAt(this.cameraTarget);

    // Values of far and near camera are so high and so narrow
    // to place the quad outside of the scene, and only render
    // the quad
    this.crossfadeCamera = new this.library.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        -1000,
        -998
    );

    this.camera.animations = [];
};

/**
 * Retrieves a mesh animation by it's name.
 *
 * @param {String} name The name of the animation to be retrieved.
 * @returns {Animation} The animation for the given name.
 */
ripe.CSR.prototype._getAnimationByName = function(name) {
    for (const keyValue of this.assetManager.animations.entries()) {
        if (keyValue[0] !== name) continue;
        return keyValue[1];
    }
    return undefined;
};

/**
 * Handles everything that is necessary to running an animation from the loaded scene.
 *
 * @param {String} animationName The name of the animation to be executed.
 */
ripe.CSR.prototype._performAnimation = function(animationName) {
    const animation = this._getAnimationByName(animationName);

    if (!animation) return;

    const clock = new this.library.Clock();
    const action = this.mixer.clipAction(animation);

    // initialize variables
    clock.start();
    clock.stop();
    action.play().stop();

    if (!this.animationLoops) {
        action.loop = this.library.LoopOnce;
    }

    let delta = -1;

    const doAnimation = () => {
        if (delta === -1) {
            // first render takes longer, done before the clock begins,
            // renders to frame buffer object to prevent from rendering
            // to screen
            this.renderer.setRenderTarget(this.previousSceneFBO);
            this.renderer.clear();
            this.renderer.render(this.scene, this.camera);

            // resets the renderer
            this.renderer.setRenderTarget(null);
            this.renderer.clear();

            clock.start();
            action.play();

            if (!this.enableRaycastAnimation) {
                // adds the no-raycast flag to improve performance
                this.element.classList.add("no-raycast");
            }
        }

        delta = clock.getDelta();
        this.mixer.update(delta);

        if (!action.paused) {
            this.needsRenderUpdate = true;
            requestAnimationFrame(doAnimation);
        } else {
            this.needsRenderUpdate = false;
            clock.stop();
            if (!this.enableRaycastAnimation) {
                // adds the no-raycast flag to improve performance
                this.element.classList.remove("no-raycast");
            }
        }
    };

    requestAnimationFrame(doAnimation);
};

/**
 * Performs a raycast from the current mouse position to check what
 * objects have been intersected, and handles the highlight and
 * lowlight operation automatically.
 *
 * @param {Event} event The mouse event that is going to be used
 * as the basis for the casting of the ray.
 */
ripe.CSR.prototype._attemptRaycast = function(event) {
    // gathers the status for a series of class value of the
    // configurator main DOM element
    const animating = this.element.classList.contains("animating");
    const dragging = this.element.classList.contains("drag");

    // prevents raycasting can be used to improve performance, as this operation
    // can be done every frame
    if (animating || dragging) return;

    // runs a series of pre-validation for the execution of the raycasting
    // if any of them fails returns immediately (not possible to ray cast)
    if (!this.raycaster) return;
    if (!this.scene) return;
    if (!this.assetManager) return;

    // starts the casting operation by attributing a new cast identifier that
    // is latter going to be used to check if the cast is up-to-date (to avoid
    // async related issues)
    const castId = this.castId ? this.castId + 1 : 1;
    this._castId = castId;

    // in case there's no available bounding box set, tries to retrieve a new
    // bounding box from the configurator's DOM element
    if (!this.boundingBox) this.boundingBox = this.element.getBoundingClientRect();

    // converts the mouse coordinates into normalized (1 based) coordinates
    // that can be used by the raycaster
    const coordinates = this._convertRaycast(event);

    let currentIntersection;

    // process different picking strategies based on configurations
    if (this.raycastStrategy === "cpu") {
        this.raycaster.setFromCamera(coordinates, this.camera);
        const intersects = this.raycaster.intersectObjects(this.assetmanager.raycastingMeshes);

        if (intersects.length > 0) currentIntersection = intersects[0].object;
    } else {
        const objectId = this.raycaster.pick(coordinates);
        currentIntersection = this.assetManager.raycastScene.getObjectById(objectId);
    }

    // did not find any intersection, return
    if (!currentIntersection) {
        this.lowlight();
        return;
    }

    // captures the name of the intersected part/sub-mesh and
    // verifies if it's not the same as the currently highlighted
    // one, if that's the case no action is taken
    const isSame =
        this.intersectedPart &&
        currentIntersection.material.uuid === this.intersectedPart.material.uuid;
    if (isSame) return;

    // "lowlights" all of the parts and highlights the one that
    // has been selected, only if the material to be highlighted
    // is different from the previous one, prevents unnecessary renders
    if (
        !this.intersectedPart ||
        currentIntersection.material.uuid !== this.intersectedPart.material.uuid
    ) {
        this.lowlight();
        this.highlight(currentIntersection);
    }

    // "saves" the currently selected part so that it can be
    // latter used to detect duplicated highlighting (performance)
    this.intersectedPart = currentIntersection;
};

/**
 * Maps a mouse event to a coordinate that goes either goes from -1 to 1 in
 * both the X and Y axis for the CPU picking, or from 0 to the width / height
 * of the bounding box.
 *
 * This method makes use of the bounding box for the normalization process.
 *
 * @param {Object} coordinates An object with the raw x and y event values.
 * @returns {Object} An object with both the x and the y normalized values for the
 * respective picking strategy..
 */
ripe.CSR.prototype._convertRaycast = function(coordinates) {
    let newX = 0;
    let newY = 0;

    // coordinates vary if using GPU or CPU picking
    switch (this.raycastStrategy) {
        case "cpu":
            // the origin of the coordinate system is the center of the element,
            // coordinates range from -1,-1 (bottom left) to 1,1 (top right)
            newX = ((coordinates.x - this.boundingBox.x) / this.boundingBox.width) * 2 - 1;
            newY =
                ((coordinates.y - this.boundingBox.y + window.scrollY) / this.boundingBox.height) *
                    -2 +
                1;
            break;
        case "gpu":
        default:
            newX = coordinates.x - this.boundingBox.x;
            newY = coordinates.y - this.boundingBox.y + window.scrollY;
            break;
    }

    return { x: newX, y: newY };
};

Object.defineProperty(ripe.CSR.prototype, "wireframe", {
    get: function() {
        return this._wireframe;
    },
    set: function(value) {
        this.updateWireframe(value);
    }
});
