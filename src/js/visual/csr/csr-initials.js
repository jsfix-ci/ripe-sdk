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
 * @classdesc Class that handles all aspects related to client side initials, from the creation of
 * the meshes themselves, as well as storing the correct positions for the initials. Automatically
 * uses sane defaults if no options are passed.
 *
 * @param {Object} owner  The owner (customizer instance) for
 * this configurator.
 * @param {Object} options The options to be used to configure the initials.
 */
ripe.CSRInitials = function(owner, options) {
    this.owner = owner;
    this.library = options.library;
    this.config = options.config.initials;
    this.options = options;

    this.initialsType = "emboss";
    this.initialsText = "";
    this.engraving = "metal_gold";

    this.align = "center";

    this.loadedFonts = {};
    this.letterMaterial = null;
    this.loadedLetterMaterials = {};
    this.textMeshes = [];

    this.logoMesh = undefined;

    this.engraving = "metal_gold";

    this._setInitialsOptions(options);
};

ripe.CSRInitials.prototype = ripe.build(ripe.Observable.prototype);
ripe.CSRInitials.prototype.constructor = ripe.CSRInitials;

/**
 * @ignore
 */
ripe.CSRInitials.prototype._setInitialsOptions = function(options = {}) {
    if (!options.initials) return;

    const initialsOptions = options.initials;

    this.engraving =
        initialsOptions.engraving === undefined ? this.engraving : initialsOptions.engraving;
    this.align = initialsOptions.align === undefined ? this.align : initialsOptions.align;
};

/**
 * @ignore
 */
ripe.CSRInitials.prototype.updateOptions = async function(options) {
    this._setInitialsOptions(options);
};

/**
 * Traverses the object to find the initials_part locations, and stores them, as well
 * as initializes the fonts.
 *
 * @param {AssetManager} assetManager The asset manager that contains all the mesh information.
 */
ripe.CSRInitials.prototype.initialize = async function(assetManager) {
    this.assetManager = assetManager;

    await this._initializeFonts();
};

/**
 * Loads the typeface JSON specified by the options.
 *
 * @param {String} type The type of font, such as "arial", for example.
 * @param {String} weight The weight of the font, such as "bold".
 */
ripe.CSRInitials.prototype._initializeFonts = async function() {
    const loader = new this.library.FontLoader();
    const baseFontPath = `${this.options.path}${this.owner.brand}/${this.owner.model}/fonts/`;

    for (let i = 0; i < this.config.fonts.length; i++) {
        const newFont = await new Promise((resolve, reject) => {
            loader.load(baseFontPath + this.config.fonts[i] + ".json", function(font) {
                resolve(font);
            });
        });

        this.loadedFonts[this.config.fonts[i]] = newFont;
    }
};

/**
 * Updates the initials meshes if it the text or the engraving has changed.
 */
ripe.CSRInitials.prototype.update = async function() {
    const initials = this.owner.initials;

    // hides or unhides logo part
    if (this.logoMesh) {
        if (
            (initials === "" && this.initialsText !== "") ||
            (initials !== "" && this.initialsText === "")
        ) {
            const isLogoVisible = initials === "" && this.initialsText !== "";
            this.logoMesh.visible = isLogoVisible;
        }
    }

    // check if it is a valid engraving
    if (this.owner.engraving !== null && this.owner.engraving.includes("viewport")) {
        return;
    }

    // if initials or engraving haven't changed
    if (initials === this.initialsText && this.owner.engraving === this.engraving) {
        return;
    }

    const newEngraving = this.owner.engraving === null ? this.engraving : this._parseEngraving();

    if (this.initialsType === "emboss") await this.embossLetters(initials, newEngraving);
    else if (this.initialsType === "engrave") await this.engraveLetters(initials, newEngraving);

    this.engraving = newEngraving;
    this.initialsText = initials;
};

/**
 * Embosses the letters based on their location.
 *
 * @param {String} initials The text to be converted to meshes.
 * @param {String} newEngraving The engraving that will dictate the material properties
 * of the text meshes.
 */
ripe.CSRInitials.prototype.embossLetters = async function(initials, newEngraving) {
    // avoid creating new materials
    let changedMaterial = false;
    if (this.letterMaterial === null || newEngraving !== this.engraving) {
        this.letterMaterial = await this._getLetterMaterial(newEngraving);
        changedMaterial = true;
    }

    // dispose all letters
    while (this.textMeshes.length > 0) {
        this.disposeLetter(0);
    }

    // Starts at 1 to line up with initials mesh position
    for (let i = 0; i < Math.min(initials.length, this.config.number); i++) {
        const posRot = this.getPosRotLetter(i, initials);
        const letter = initials.charAt(i);

        const mesh = this.createLetter(letter);

        this.textMeshes.push(mesh);

        if (changedMaterial) {
            this.assetManager.disposeMaterial(this.textMeshes[i].material);
            this.textMeshes[i].material = this.letterMaterial.clone();
        }

        this.textMeshes[i].position.set(posRot.position.x, posRot.position.y, posRot.position.z);
        this.textMeshes[i].rotation.set(posRot.rotation.x, posRot.rotation.y, posRot.rotation.z);
    }
};

/**
 * Extracts the material's type and color from an engraving.
 */
ripe.CSRInitials.prototype._parseEngraving = function() {
    const splitProps = this.owner.engraving.split("::");
    let material, type;

    if (splitProps[0] === "style") {
        material = splitProps[1].split("_")[0];
        type = splitProps[1].split("_")[1];
    } else {
        material = splitProps[0].split("_")[0];
        type = splitProps[0].split("_")[1];
    }

    return material + "_" + type;
};

/**
 * Handles loading the correct material for the letter.
 *
 * @param {String} engraving The parsed engraving.
 */
ripe.CSRInitials.prototype._getLetterMaterial = async function(engraving) {
    let material = engraving.split("_")[0];
    let type = engraving.split("_")[1];
    let letterMaterial = null;

    // check if material exists, otherwise use the first one
    // it finds
    if (this.config.materials.material && this.config.materials.material.type) {
        letterMaterial = await this.assetManager.loadMaterial("initials", material, type);
    } else {
        material = Object.keys(this.config.materials)[0];
        type = Object.keys(this.config.materials[material])[0];

        letterMaterial = await this.assetManager.loadMaterial("initials", material, type);
    }

    return letterMaterial;
};

/**
 * Disposes a single letter by removing their geometry, and not the materials
 * as these may be necessary for the other letters.
 *
 * @param {Number} index The index of the letter to be disposed.
 */
ripe.CSRInitials.prototype.disposeLetter = function(index) {
    // is trying to dispose letter outside of bounds
    if (index >= this.textMeshes.length) return;

    this.textMeshes[index].geometry.dispose();
    this.textMeshes.pop();
};

/**
 * Gets the appropriate position and rotation for a letter, based on the nearest
 * initial_part mesh.
 *
 * @param {Number} letterOffset The number (offset) of the letter to be positioned.
 * @param {String} initials The text of the initials.
 * @return {Object} The object that describes the transform.
 */
ripe.CSRInitials.prototype.getPosRotLetter = function(letterOffset, initials) {
    const transform = {};
    const size = this.config.number;

    const center = (size + 1) / 2;

    let posInInitials = 0;

    if (this.align === "left") {
        posInInitials = letterOffset;
    } else if (this.align === "right") {
        posInInitials = size - Math.min(initials.length, size) + letterOffset;
    } else {
        posInInitials = center + letterOffset - (initials.length + 1) / 2;
    }

    // if it aligns perfectly with the mesh position
    if (
        this.align !== "center" ||
        (this.align === "center" && initials.length % 2 === size % 2) ||
        (this.align === "center" && initials.length % 3 === size % 3)
    ) {
        const position = new this.library.Vector3(
            this.config.placements[posInInitials].position.x,
            this.config.placements[posInInitials].position.y,
            this.config.placements[posInInitials].position.z
        );
        transform.position = position;

        const rotation = new this.library.Vector3(
            this.config.placements[posInInitials].rotation.x,
            this.config.placements[posInInitials].rotation.y,
            this.config.placements[posInInitials].rotation.z
        );

        transform.rotation = rotation;
        console.log(transform);
        return transform;
    }

    // doesn't align, interpolate between the two closest positions
    const previous = this.config.placements[Math.floor(posInInitials)];
    const next = this.config.placements[Math.ceil(posInInitials)];

    const position = new this.library.Vector3(0, 0, 0);
    const rotation = new this.library.Vector3(0, 0, 0);

    position.x = (previous.position.x + next.position.x) / 2;
    position.y = (previous.position.y + next.position.y) / 2;
    position.z = (previous.position.z + next.position.z) / 2;

    rotation.x = (previous.rotation.x + next.rotation.x) / 2;
    rotation.y = (previous.rotation.y + next.rotation.y) / 2;
    rotation.z = (previous.rotation.z + next.rotation.z) / 2;

    transform.position = position;
    transform.rotation = rotation;

    return transform;
};

/**
 * Creates a text mesh, and assigns it the correct material.
 *
 * @param {String} letter The character to be added.
 * @returns {Mesh} The generated mesh for the letter
 */
ripe.CSRInitials.prototype.createLetter = function(letter) {
    let fontName = "";

    if (this.config.fonts) fontName = this.config.fonts[0];

    let textGeometry = new this.library.TextGeometry(letter, {
        font: this.loadedFonts[fontName],
        size: this.config.scale,
        height: this.config.thickness,
        curveSegments: 10
    });

    textGeometry = new this.library.BufferGeometry().fromGeometry(textGeometry);

    const letterMesh = new this.library.Mesh(textGeometry, this.letterMaterial);

    // rotates geometry to negate default text rotation
    letterMesh.geometry.center();

    return letterMesh;
};

/**
 * @ignore
 */
ripe.CSRInitials.prototype.engraveLetters = function(initials, newEngraving) {};

/**
 * Destroys all meshes and materials.
 */
ripe.CSRInitials.prototype.disposeResources = async function() {
    for (const textMesh of this.textMeshes) {
        await this.assetManager.disposeMesh(textMesh);
    }

    for (const mesh of Object.values(this.initialsPositions)) {
        await this.assetManager.disposeMesh(mesh);
    }

    if (this.letterMaterial) await this.assetManager.disposeMaterial(this.letterMaterial);

    this.loadedFonts = {};
    this.loadedLetterMaterials = {};
    this.initialsPositions = {};
    this.textMeshes = [];
    this.library = null;
    this.textMeshes = [];
};
