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
ripe.CSRAssetManager = function(csr, owner, options) {
    // there must be a model configuration, otherwise an error will occur
    // in case there's not throws a series of exceptions
    if (!options.config) throw new Error("No valid configuration provided");

    this.owner = owner;
    this.csr = csr;
    this.assetsPath = options.path || "";

    this.library = options.library;
    this.owner = owner;

    this.usesBuild = options.usesBuild === undefined ? true : options.usesBuild;
    // model path can only be passed if it does not use a config
    if (!this.usesConfig) {
        this.modelPath = options.modelPath;
    }

    this.format = options.format || "gltf";
    this.textureLoader = new this.library.TextureLoader();

    this.modelConfig = options.config;

    this.wireframes = {};
    this.animations = new Map();
    this.loadedTextures = {};
    this.environmentTexture = null;
    this.environmentScene = options.scene === undefined ? null : options.scene;

    // creates a temporary render to be able to obtain a
    // series of properties that will be applicable to an
    // equivalent renderer that is going to be created
    const renderer = new this.library.WebGLRenderer({ antialias: true, alpha: true });
    try {
        this.maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    } finally {
        renderer.dispose();
    }
};

ripe.CSRAssetManager.prototype = ripe.build(ripe.Observable.prototype);
ripe.CSRAssetManager.prototype.constructor = ripe.CSRAssetManager;

/**
 * @ignore
 */
ripe.CSRAssetManager.prototype.updateOptions = async function(options) {
    // materials
    this.assetsPath = options.path === undefined ? this.assetsPath : options.path;
    this.modelConfig = options.config === undefined ? this.modelConfig : options.config;
};

/**
 * Loads the complete base set of assets for the scene.
 *
 * Chooses the correct file loader based on the given format.
 *
 * @param options The options to configure the assets loading.
 */
ripe.CSRAssetManager.prototype.loadAssets = async function(scene, { wireframes = false } = {}) {
    this.scene = scene;

    // loads the initial mesh asset to be used as the main mesh
    // of the scene (should use the RIPE SDK for model URL) and
    // then loads its sub-meshes
    const asset = await this._loadAsset();

    if (this.environmentScene) await this._loadAsset(this.environmentScene, "scene");

    if (wireframes) this._loadWireframes(asset);

    // sets the materials for the first time, if the model uses build
    if (this.usesBuild) {
        await this.setMaterials(this.owner.parts);
        // loads the complete set of animations defined in the
        // model configuration

        for (let i = 0; i < this.modelConfig.assets.animations.length; i++) {
            await this._loadAsset(this.modelConfig.assets.animations[i], "animation");
        }
    } else {
        // Updates the base colors for all the materials currently being used,
        // since setMaterials is never run
        this._storePartsColors();
    }

    this.csr.initialize();
};

/**
 * Loads an asset from the remote that source using a series
 * of conventions to determine the appropriate source path.
 *
 * As part of the loading process the current instance internal
 * are going to be mutated with the newly registers values.
 *
 * @param {String} filename The name of the asset that is going
 * be retrieved and loaded.
 * @param {String} kind The kind of asset to be loaded (eg `mesh`,
 * `animation`, `texture`, etc.).
 * @returns {Object} The asset that has been loaded.
 */
ripe.CSRAssetManager.prototype._loadAsset = async function(filename = null, kind = "mesh") {
    const loadersM = {
        gltf: this.library.GLTFLoader,
        fbx: this.library.FBXLoader
    };

    let type = null;
    let path = null;

    switch (kind) {
        case "animation":
            path = `${this.assetsPath}${this.owner.brand}/animations/${this.owner.model}/${filename}`;
            break;
        case "scene":
            path = `${this.assetsPath}${this.owner.brand}/scenes/${filename}`;
            break;
        case "mesh":
        default:
            if (this.usesBuild) {
                path = this.owner.getMeshUrl({
                    variant: "$base"
                });
            } else {
                path = `${this.assetsPath}${this.modelPath}`;
            }
    }

    // tries to determine the proper type of file that is represented
    // by the file name in question
    if (path.endsWith(".gltf")) type = "gltf";
    else if (path.endsWith(".fbx")) type = "fbx";
    else type = "gltf";

    // gathers the proper loader class and then creates a new instance
    // of the loader that is going to be used
    const loader = new loadersM[type]();

    // encapsulates the loader logic around a promise and waits
    // for it to be finalized in success or in error
    let asset = await new Promise((resolve, reject) => {
        loader.load(
            path,
            asset => resolve(asset),
            null,
            err => reject(err)
        );
    });

    let meshCount = 0;

    switch (kind) {
        case "animation":
            // "gathers" the first animation of the asset as the main,
            // the one that is going to be store in memory
            this.animations.set(filename, asset.animations[0]);
            return null;
        case "scene":
            // traverses the scene to add shadows to the loaded meshes
            asset.scene.traverse(child => {
                if (child.isLight) {
                    child.castShadow = true;
                    child.shadow.mapSize.width = 1024;
                    child.shadow.mapSize.height = 1024;
                }

                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // store the environment scene to be later added
            this.scene.add(asset.scene);

            return null;
        case "mesh":
        default:
            // adds embedded animations in the file to animations
            // array
            for (const anim in asset.animations) {
                const animName = asset.animations[anim].name;

                // only load animations that have a name
                if (!animName) continue;

                this.animations.set(animName, asset.animations[anim]);
            }

            // for the glTF assets a small hack is required so
            // the asset in question is the scene, this is required
            // because glTF is a packaging format for multiple assets
            // and we're only concerted with the scene here
            if (type === "gltf") asset = asset.scene;

            // traverses scene to set shadows to meshses and add them to
            // raycasting structures
            asset.traverse(child => {
                // if it contains lights make them cast shadows
                if (child.isLight) {
                    child.castShadow = true;
                    child.shadow.mapSize.width = 1024;
                    child.shadow.mapSize.height = 1024;
                }

                if (child.isMesh || child.type === "Object3D") {
                    meshCount++;

                    // if it's a mesh, process it, and add it to
                    // raycasting structure
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.visible = true;

                    // remove frustum culling to prevent incorrect
                    // culling on skinned meshes
                    child.frustumCulled = false;
                }
            });

            this.modelScene = asset;

            console.info(`Loaded ${meshCount} meshes.`);

            // updates the loaded scene variable with the assets
            // that has just been loaded
            this.scene.add(asset);

            break;
    }

    // returns the asset that has been loaded to the caller
    // method, must be used carefully to avoid memory leaks
    return asset;
};

ripe.CSRAssetManager.prototype._loadWireframes = function(visible = false) {
    this.scene.traverse(child => {
        if (!child.isMesh) return;

        const wireframe = this._buildWireframe(child);
        wireframe.visible = visible;

        this.scene.add(wireframe);

        this.wireframes[child.name] = wireframe;
    });
};

/**
 * Disposes a texture fully, releasing potential mipmaps
 * from memory.
 *
 * @param {Texture} texture The texture to be disposed.
 */
ripe.CSRAssetManager.prototype._releaseTexture = async function(texture) {
    if (texture.image instanceof Array) {
        for (let i = 0, len = texture.image.length; i < len; i++) {
            if (texture.image[i]) {
                if (texture.image[i].mipmaps) {
                    texture.image[i].mipmaps.length = 0;
                }

                texture.image[i] = undefined;
            }
        }
    } else if (texture.image) {
        if (texture.image.mipmaps) {
            texture.image.mipmaps.length = 0;
        }

        texture.image = undefined;
    }
    if (texture.mipmaps) {
        texture.mipmaps.length = 0;
    }

    texture.onUpdate = undefined;
    texture.dispose();
};

/**
 * Disposes a material, by first removing all associated maps.
 *
 * @param {Material} material The material to be disposed.
 */
ripe.CSRAssetManager.prototype.disposeMaterial = async function(material) {
    if (material.map) await this._releaseTexture(material.map);
    if (material.aoMap) await this._releaseTexture(material.aoMap);
    if (material.roughnessMap) await this._releaseTexture(material.roughnessMap);
    if (material.specularMap) await this._releaseTexture(material.specularMap);
    if (material.normalMap) await this._releaseTexture(material.normalMap);
    if (material.envMap) await this._releaseTexture(material.envMap);
    if (material.metalnessMap) await this._releaseTexture(material.metalnessMap);
    if (material.emissiveMap) await this._releaseTexture(material.emissiveMap);
    if (material.aoMap) await this._releaseTexture(material.aoMap);

    material.dispose();
};

/**
 * Disposes not only the mesh, but all the attributes, geometries and materials associated
 * with it.
 *
 * @param {Mesh} mesh The mesh to be disposed.
 */
ripe.CSRAssetManager.prototype.disposeMesh = async function(mesh) {
    if (mesh.material) await this.disposeMaterial(mesh.material);
    if (!mesh.geometry) return;

    mesh.geometry.dispose();
    mesh.geometry = null;
};

/**
 * Disposes a scene by destroying all the meshes, removing them from the scene, and then
 * destroying the scene itself.
 *
 * @param {Scene} scene The scene to be disposed.
 */
ripe.CSRAssetManager.prototype.disposeScene = async function(scene) {
    if (!scene) return;

    if (scene.environment) scene.environment.dispose();
    const self = this;

    // dispose all children of the scene appropriately
    await scene.traverse(async function(child) {
        if (child.isMesh) await self.disposeMesh(child);
        // Scene.dispose() has been deprecated
        else if (child.dispose && child.type !== "Scene") child.dispose();

        child = null;
    });

    scene = null;
};

/**
 * Disposes all the stored resources to avoid memory leaks. Includes meshes,
 * geometries and materials.
 */
ripe.CSRAssetManager.prototype.disposeResources = async function() {
    for (const wireframe of Object.values(this.wireframes)) {
        await this.disposeMesh(wireframe);
    }

    for (const [name, value] of Object.entries(this.loadedTextures)) {
        await this._releaseTexture(value);
        this.loadedTextures[name] = null;
    }

    this.loadedTextures = {};
};

/**
 * Propagates material for all meshes that either match the partName
 * or use the structure 'partName.number'.
 *
 * @param {Object} partName The part name that will be used for
 * identifying the meshes.
 * @param {Material} material The material that will be set.
 */
ripe.CSRAssetManager.prototype.applyMaterial = function(partName, newMaterial) {
    // traverse entire scene to discover the target meshes
    this.modelScene.traverse(child => {
        if (!child.isMesh) return;

        // if it does not match the name, nor contains a number
        if (!(child.name === partName || child.name.includes(partName + "_"))) return;

        if (child.material) {
            // child.material.dispose();
            // child.material = null;
        }

        // small tweak for transparent materials
        if (newMaterial.transparent === true) {
            child.castShadow = false;
        } else {
            child.castShadow = true;
        }

        child.material = newMaterial;
    });

    newMaterial.dispose();
};

/**
 * Responsible for loading and, if specified, applying the materials to
 * the correct meshes.
 *
 * @param {Object} parts The parts configuration, that maps the part
 * to a material.
 * @param {Boolean} autoApply Decides if applies the materials or just
 * loads all the textures.
 */
ripe.CSRAssetManager.prototype.setMaterials = async function(parts, autoApply = true) {
    for (const part in parts) {
        if (part === "shadow") {
            continue;
        }

        const material = parts[part].material;
        const color = parts[part].color;

        let newMaterial = null;

        // if material does not exist, then use the default one
        if (!this.modelConfig.assets.materials[part][material]) {
            newMaterial = await this.loadMaterial(part, "default");
        } else {
            newMaterial = await this.loadMaterial(part, material, color);
        }

        // in case no auto apply is request returns the control flow
        // to the caller function immediately
        if (!autoApply) {
            // only dispose the materials, not the textures, as they
            // need to be loaded
            newMaterial.dispose();
            continue;
        }

        this.applyMaterial(part, newMaterial);
    }

    // apply default materials for meshes that do not have an associated part
    for (const part in this.modelConfig.assets.materials) {
        // if it's a known part, it has already been added
        if (Object.keys(parts).includes(part)) {
            continue;
        }

        const newMaterial = await this.loadMaterial(part, "default");

        this.applyMaterial(part, newMaterial);
    }

    // Updates the base colors for all the materials currently being used
    this._storePartsColors();
};

/**
 * Stores the base colors for each material, based on their UUID.
 *
 * Used for giving masks their correct values when highlighted or
 * lowlighted.
 */
ripe.CSRAssetManager.prototype._storePartsColors = function() {
    this.partsColors = {};

    // iterates through all raycasting meshes, as these are the meshes
    // and empties that belong to the object itself, and not the whole
    // scene, and stores the initial color value for each material
    this.modelScene.traverse(child => {
        if (!child.isMesh || !child.material) return;

        const material = child.material;

        // maps the uuid to the base color used
        this.partsColors[material.uuid] = [material.color.r, material.color.g, material.color.b];
    });
};

/**
 * Returns a material, containing all the maps specified in the config.
 * Stores the textures in memory to allow for faster material change.
 *
 * @param {String} part The part that will receive the new material
 * @param {String} type The type of material, such as "python" or "nappa".
 * @param {String} color The color of the material.
 */
ripe.CSRAssetManager.prototype.loadMaterial = async function(part, type, color) {
    let materialConfig;
    let newMaterial;

    // if the default mode is requested, the model config only
    // requires the part
    // check if specifc material config exists
    if (part === "initials") {
        materialConfig = this.modelConfig.initials.materials[type][color];
    } else if (
        this.modelConfig.assets.materials[part] &&
        this.modelConfig.assets.materials[part][type] &&
        this.modelConfig.assets.materials[part][type][color]
    ) {
        materialConfig = this.modelConfig.assets.materials[part][type][color];
    } else {
        materialConfig = this.modelConfig.assets.materials[part].default;
    }

    // follows specular-glossiness workflow
    if (materialConfig.specularMap || materialConfig.specular) {
        newMaterial = new this.library.MeshPhongMaterial();
    }
    // otherwise follows PBR workflow, considered to be a
    // standard material with the THREE.js library
    else {
        newMaterial = new this.library.MeshPhysicalMaterial();
    }

    // allows for skinned meshes to have materials
    newMaterial.skinning = true;

    // builds the base relative path for the loading of textures
    // using a pre-defined convention for the structure
    const basePath = `${this.assetsPath}${this.owner.brand}/${this.owner.model}/`;

    for (const prop in materialConfig) {
        // if it's a map, loads and applies the texture
        if (prop.includes("map") || prop.includes("Map")) {
            const mapPath = basePath + materialConfig[prop];
            if (!this.loadedTextures[mapPath]) {
                const texture = await new Promise((resolve, reject) => {
                    this.textureLoader.load(mapPath, function(loadedTexture) {
                        resolve(loadedTexture);
                    });
                });

                if (prop === "metalnessMap") {
                    newMaterial.metalness = 1;
                }

                if (prop === "aoMap") {
                    newMaterial.aoMapIntensity = 0.33;
                }

                // if the texture is used for color information, set colorspace to sRGB
                if (prop === "map" || prop.includes("emissive")) {
                    texture.encoding = this.library.sRGBEncoding;
                } else {
                    texture.encoding = this.library.LinearEncoding;
                }
                texture.anisotropy = this.maxAnisotropy;

                // UVs use the convention that (0, 0) corresponds to the
                // upper left corner of a texture
                texture.flipY = false;

                this.loadedTextures[mapPath] = texture;
                // since the material already has the texture,
                // we can safely dispose it
                texture.dispose();
            }

            newMaterial[prop] = this.loadedTextures[mapPath];
        }
        // if it's not a map, it's a property, apply it
        else if (prop === "color" || prop === "specular") {
            const color = this.getColorFromProperty(materialConfig[prop]);
            newMaterial[prop] = color;
        } else {
            newMaterial[prop] = materialConfig[prop];
        }
    }

    return newMaterial;
};

ripe.CSRAssetManager.prototype.getColorFromProperty = function(value) {
    // checks if it is hex or simple value and applies the proper
    // color string transformation accordingly
    if (typeof value === "string" && value.includes("#")) {
        return new this.library.Color(value);
    }
    // otherwise it's a simple value and should be applied to all
    // of the different color channels equally
    else {
        return new this.library.Color(value, value, value);
    }
};

/**
 * Loads an HDR environment and applies it to the scene.
 *
 * @param {Mesh} scene The scene that will have the new environment.
 * @param {WebGLRenderer} renderer The renderer that will generate the
 * equirectangular maps.
 * @param {String} environment The name of the environment to be loaded.
 * @param {Boolean} useEnvironmentAsBackground Determines whether scene background
 * is the environment texture.
 */
ripe.CSRAssetManager.prototype.setupEnvironment = async function(scene, renderer, environment, useEnvironmentAsBackground) {
    const pmremGenerator = new this.library.PMREMGenerator(renderer);
    const environmentMapPath = `${this.assetsPath}${this.owner.brand}/${this.owner.model}/${environment}`;

    const rgbeLoader = new this.library.RGBELoader();
    const texture = await new Promise((resolve, reject) => {
        rgbeLoader.setDataType(this.library.UnsignedByteType).load(environmentMapPath, texture => {
            resolve(texture);
        });
    });

    pmremGenerator.compileEquirectangularShader();
    const environmentTexture = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = environmentTexture;

    if (useEnvironmentAsBackground)
        scene.background = environmentTexture;

    // dispose unnecessary resources
    texture.dispose();
    environmentTexture.dispose();
    pmremGenerator.dispose();
    environmentTexture.dispose();
};

/**
 * Builds a wireframe mesh from the provided base mesh.
 *
 * The wireframe mesh is composed by line segments that create the
 * border of the multiple polygons of the original mesh.
 *
 * @param {Mesh} mesh The mesh from which the wireframe version of the
 * mesh is going to be built.
 * @returns {Mesh} The resulting wireframe mesh.
 */
ripe.CSRAssetManager.prototype._buildWireframe = function(mesh) {
    const wireframe = new this.library.WireframeGeometry(mesh.geometry);
    const line = new this.library.LineSegments(wireframe);
    line.material.depthTest = false;
    line.material.opacity = 0.25;
    line.material.transparent = true;
    line.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
    line.scale.set(mesh.scale.y, mesh.scale.y, mesh.scale.z);
    line.setRotationFromEuler(mesh.rotation);
    return line;
};
