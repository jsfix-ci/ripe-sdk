/**
 * Adapted from the script by:
 * @author bzztbomb https://github.com/bzztbomb
 * @author jfaust https://github.com/jfaust
 */

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
 * GPU picker that enables Skinned Meshes to be correctly picked.
 *
 * @param {CSR} csr The current instance of the CSR, containing
 * all the necessary information for the GPU picker to function correctly.
 */
ripe.CSRGPUPicker = function(csr) {
    this.library = csr.library;

    this.renderer = csr.renderer;
    this.scene = csr.scene;
    this.camera = csr.camera;

    // 1x1 pixel render target we use to do the picking
    this.pickingTarget = new this.library.WebGLRenderTarget(1, 1, {
        minFilter: this.library.NearestFilter,
        magFilter: this.library.NearestFilter,
        format: this.library.RGBAFormat,
        encoding: this.library.LinearEncoding
    });

    // empty scene to use .render in order to call renderBufferDirect in renderList()
    // use the onAfterRender callback to actually render geometry for picking
    this.emptyScene = new this.library.Scene();

    const self = this;

    this.emptyScene.onAfterRender = () => {
        // the render lists are still filled with valid data, so we can
        // submit them again for picking
        const renderList = self.renderer.renderLists.get(self.scene, self.camera);

        if (renderList) renderList.opaque.forEach(item => self.processItem(item));
    };

    // RGBA is 4 channels.
    this.pixelBuffer = new Uint8Array(4 * this.pickingTarget.width * this.pickingTarget.height);
    this.clearColor = new this.library.Color(0xffffff);
    this.materialCache = [];
};

ripe.CSRGPUPicker.prototype = ripe.build(ripe.Observable.prototype);
ripe.CSRGPUPicker.prototype.constructor = ripe.CSRGPUPicker;

/**
 * Raycasts an object based on coordinates.
 *
 * @param {Object} coordinates Object containing the normalized X and Y coordinates
 * for the GPU picking process.
 */
ripe.CSRGPUPicker.prototype.pick = function(coordinates) {
    const w = this.renderer.domElement.width;
    const h = this.renderer.domElement.height;
    // set the projection matrix to only look at the pixel we are interested in.
    this.camera.setViewOffset(w, h, coordinates.x, coordinates.y, 1, 1);

    const currRenderTarget = this.renderer.getRenderTarget();
    const currClearColor = this.renderer.getClearColor();

    this.renderer.setRenderTarget(this.pickingTarget);
    this.renderer.setClearColor(this.clearColor);
    this.renderer.clear();
    this.renderer.render(this.emptyScene, this.camera);
    this.renderer.readRenderTargetPixels(
        this.pickingTarget,
        0,
        0,
        this.pickingTarget.width,
        this.pickingTarget.height,
        this.pixelBuffer
    );
    this.renderer.setRenderTarget(currRenderTarget);
    this.renderer.setClearColor(currClearColor);
    this.camera.clearViewOffset();

    const val =
        (this.pixelBuffer[0] << 24) +
        (this.pixelBuffer[1] << 16) +
        (this.pixelBuffer[2] << 8) +
        this.pixelBuffer[3];
    return val;
};

/**
 * Processes the meshes' material, and renders to an indirect buffer
 * to be used for picking.
 *
 * @param {Object} renderItem The rendered object from the render list.
 */
ripe.CSRGPUPicker.prototype.processItem = function(renderItem) {
    // check if it's the environment scene
    if (renderItem.material.name === "BackgroundCubeMaterial") {
        return;
    }

    const object = renderItem.object;

    if (!object.isMesh) {
        return;
    }

    const objId = object.id;
    const material = renderItem.material;
    const geometry = renderItem.geometry;

    let useMorphing = 0;

    if (material.morphTargets === true) {
        if (geometry.isBufferGeometry === true) {
            useMorphing =
                geometry.morphAttributes &&
                geometry.morphAttributes.position &&
                geometry.morphAttributes.position.length > 0
                    ? 1
                    : 0;
        } else if (geometry.isGeometry === true) {
            useMorphing = geometry.morphTargets && geometry.morphTargets.length > 0 ? 1 : 0;
        }
    }

    let useSkinning = 0;
    if (object.isSkinnedMesh === true) {
        if (material.skinning === true) {
            useSkinning = 1;
        } else {
            console.warn("THREE.SkinnedMesh with material.skinning set to false:", object);
        }
    }

    const useInstancing = object.isInstancedMesh === true ? 1 : 0;
    const frontSide = material.side === this.library.FrontSide ? 1 : 0;
    const backSide = material.side === this.library.BackSide ? 1 : 0;
    const doubleSide = material.side === this.library.DoubleSide ? 1 : 0;
    const index =
        (useMorphing << 0) |
        (useSkinning << 1) |
        (useInstancing << 2) |
        (frontSide << 3) |
        (backSide << 4) |
        (doubleSide << 5);
    let renderMaterial = renderItem.object.pickingMaterial
        ? renderItem.object.pickingMaterial
        : this.materialCache[index];
    if (!renderMaterial) {
        renderMaterial = new this.library.ShaderMaterial({
            skinning: useSkinning > 0,
            morphTargets: useMorphing > 0,
            vertexShader: this.library.ShaderChunk.meshbasic_vert,
            fragmentShader: `
          uniform vec4 objectId;
          void main() {
            gl_FragColor = objectId;
          }
        `,
            side: material.side
        });
        renderMaterial.uniforms = {
            objectId: { value: [1.0, 1.0, 1.0, 1.0] }
        };
        this.materialCache[index] = renderMaterial;
    }
    renderMaterial.uniforms.objectId.value = [
        ((objId >> 24) & 255) / 255,
        ((objId >> 16) & 255) / 255,
        ((objId >> 8) & 255) / 255,
        (objId & 255) / 255
    ];
    renderMaterial.uniformsNeedUpdate = true;
    this.renderer.renderBufferDirect(this.camera, null, geometry, renderMaterial, object, null);
};
