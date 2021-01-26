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
 * @classdesc Class that handles controlling the scene based on input.
 *
 * @param {CSR} csr The base CSR instance.
 * @param {ConfiguratorCSR} configurator The configurator instance.
 * @param {Object} element The HTML element that contains the configurator.
 * @param {Object} options The options to be used to configure the controls.
 */
ripe.CSRControls = function(csr, configurator, element, options) {
    this.csr = csr;
    this.configurator = configurator;
    this.camera = csr.camera;
    this.element = element;

    this.maximumHorizontalRot = 359;
    this.minimumHorizontalRot = 0;
    this.maximumVerticalRot = 89;
    this.minimumVerticalRot = 0;

    this.rotationEasing = "easeInOutQuad";

    this.maxDistance = 1000;
    this.minDistance = 0;

    this.lockRotation = "";

    this.smoothControls = true;

    this.canZoom = true;
    this.canPan = true;
    this.canPivot = true;

    this._previousRotEvent = null;
    this._previousPanEvent = null;

    this._setControlsOptions(options);
    this._registerHandlers();

    this.referenceCameraTarget = this.csr.cameraTarget;
    this.referenceCameraDistance = this.csr.initialDistance;

    // distance variables
    this.targetDistance = this.csr.initialDistance;
    this.currentDistance = this.csr.initialDistance;

    // rotation variables
    const startingPosition = options.position || 0;
    const initialXRot = this.positionToRotation(startingPosition);

    this.targetRotation = new this.csr.library.Vector2(initialXRot, 0);
    this.currentRotation = this.targetRotation.clone();

    // camera target and panning variables
    this.targetPan = this.referenceCameraTarget.clone();
    this.currentPan = this.referenceCameraTarget.clone();

    this.isPanning = false;
    this.isRotating = false;
    this.isScrolling = false;

    this.maxDriftTime = 0.6;

    this.createLoop();
};

ripe.CSRControls.prototype = ripe.build(ripe.Observable.prototype);
ripe.CSRControls.prototype.constructor = ripe.CSRControls;

/**
 * Sets the controls parameters based on options struct.
 *
 * @param {Object} options The struct containing the parameters that will dictate the
 * controls' behaviour.
 */
ripe.CSRControls.prototype._setControlsOptions = function(options) {
    if (options.camera) {
        this.currentDistance =
            options.camera.distance === undefined ? this.currentDistance : options.camera.distance;
        this.baseDistance = this.currentDistance;
        this.maxDistance =
            options.camera.maxDistance === undefined
                ? this.maxDistance
                : options.camera.maxDistance;
        this.minDistance =
            options.camera.minDistance === undefined
                ? this.minDistance
                : options.camera.minDistance;
    }

    if (!options.controls) return;

    const controlOptions = options.controls;

    this.maximumHorizontalRot =
        controlOptions.maximumHorizontalRot === undefined
            ? this.maximumHorizontalRot
            : controlOptions.maximumHorizontalRot;
    this.minimumHorizontalRot =
        controlOptions.minimumHorizontalRot === undefined
            ? this.minimumHorizontalRot
            : controlOptions.minimumHorizontalRot;

    this.maximumVerticalRot =
        controlOptions.maximumVerticalRot === undefined
            ? this.maximumVerticalRot
            : controlOptions.maximumVerticalRot;
    this.minimumVerticalRot =
        controlOptions.minimumVerticalRot === undefined
            ? this.minimumVerticalRot
            : controlOptions.minimumVerticalRot;

    // types of transition can be "cross", "rotation" or "none"
    this.rotationEasing =
        controlOptions.rotationEasing === undefined
            ? this.rotationEasing
            : controlOptions.rotationEasing;

    this.lockRotation =
        controlOptions.lockRotation === undefined ? this.lockRotation : controlOptions.lockRotation;

    this.canZoom = controlOptions.canZoom === undefined ? this.canZoom : controlOptions.canZoom;
    this.canPan = controlOptions.canPan === undefined ? this.canPan : controlOptions.canPan;
    this.canPivot = controlOptions.canPivot === undefined ? this.canPivot : controlOptions.canPivot;

    this.smoothControls =
        controlOptions.smoothControls === undefined
            ? this.smoothControls
            : controlOptions.smoothControls;
};

/**
 * @ignore
 */
ripe.CSRControls.prototype.updateOptions = async function(options) {
    this.element = options.element === undefined ? this.element : options.element;

    const startingPosition =
        options.position === undefined ? this.element.position : options.position;
    this.currentRotation.x = this.positionToRotation(startingPosition);
    this._setControlsOptions(options);
};

/**
 * Registers the handlers that will listen to events happening inside the configurator element.
 */
ripe.CSRControls.prototype._registerHandlers = function() {
    // captures the current context to be used inside clojures
    const self = this;

    // retrieves the reference to the multiple elements that
    // are going to be used for event handler operations
    const area = this.element.querySelector(".area");

    // binds the mousedown event on the element to prepare
    // it for drag movements
    area.addEventListener("mousedown", function(event) {
        const _element = self.element;
        const animating = self.element.classList.contains("animating");

        if (animating) return;

        _element.dataset.view = _element.dataset.view || "side";

        // differentiate between normal click and middle click
        // as the latter pans and not
        if (event.which === 2 && self.canPan) {
            self.middleDown = true;
            self._previousPanEvent = event;
        } else {
            self.down = true;
            self._previousRotEvent = event;
        }

        _element.classList.add("drag");
    });

    // listens for mouseup events and if it occurs then
    // stops reacting to mouse move events has drag movements
    area.addEventListener("mouseup", function(event) {
        const _element = self.element;
        self.down = false;
        self.middleDown = false;
        _element.classList.remove("drag");

        event = ripe.fixEvent(event);

        // self._previousPanEvent = undefined;
        // self._previousRotEvent = undefined;
    });

    // listens for mouse leave events and if it occurs then
    // stops reacting to mousemove events has drag movements
    area.addEventListener("mouseout", function(event) {
        this.classList.remove("drag");

        self.middleDown = false;
        self.down = false;
        // self._previousPanEvent = undefined;
        // self._previousRotEvent = undefined;
    });

    // listens for mouse enter events and if it occurs then
    // resets the current parameters
    area.addEventListener("mouseenter", function(event) {
        self.down = false;
        self.middleDown = false;
    });

    // recenter operation
    area.addEventListener("dblclick", function(event) {
        self.csr._attemptRaycast(event, "recenter");
    });

    // if a mouse move event is triggered while the mouse is
    // pressed down then updates the position of the drag element
    area.addEventListener("mousemove", function(event) {
        const preventsDrag = self.element.classList.contains("no-drag");
        const animating = self.element.classList.contains("animating");

        if (preventsDrag || animating) return;

        if (self.down) {
            self._parseDrag(event);
        } else if (self.middleDown) {
            self._parsePan(event);
        }
    });

    area.addEventListener("click", function(event) {
        // verifies if the previous drag operation (if any) has exceed
        // the minimum threshold to be considered drag (click avoided)
        if (Math.abs(self.previous) > self.clickThreshold) {
            event.stopImmediatePropagation();
            event.stopPropagation();
            return;
        }

        event = ripe.fixEvent(event);

        event.stopPropagation();
    });

    area.addEventListener("dragstart", function(event) {
        event.preventDefault();
    });

    area.addEventListener("dragend", function(event) {
        event.preventDefault();
    });

    // adds handlers for the touch events so that they get
    // parsed to mouse events for the configurator element,
    // taking into account that there may be a touch handler
    // already defined
    ripe.touchHandler(this.element);

    if (!this.canZoom) return;

    // listens to the mouse wheel event to zoom in or out
    area.addEventListener(
        "wheel",
        function(event) {
            event.preventDefault();

            const animating = self.element.classList.contains("animating");

            if (animating) return;

            self._parseScroll(event);
        },
        { passive: false }
    );
};

ripe.CSRControls.prototype.performSimpleRotation = function() {
    const options = {
        rotationX: this.currentRotation.x,
        rotationY: this.currentRotation.y,
        distance: this.currentDistance,
        target: this.currentPan
    };

    this.csr.rotate(options);
};

ripe.CSRControls.prototype.createLoop = function() {
    this.rotationLoop = () => {
        // apply simple rotations and translations if smooth controls
        // are disabled
        if (!this.smoothControls) {
            this.currentDistance = this.targetDistance;
            this.currentRotation.x = this.validHorizontalAngle(
                this.targetRotation.x + this.currentRotation.x
            );
            this.currentRotation.y = Math.min(
                Math.max(this.minimumVerticalRot, this.currentRotation.y + this.targetRotation.y),
                this.maximumVerticalRot
            );

            // reset rotation
            this.targetRotation.set(0, 0);

            this.performSimpleRotation();
            return;
        }

        // only run if any operation has happened
        if (!this.isPanning && !this.isRotating && !this.isScrolling) return;

        if (this.isRotating) this.updateRotation();

        if (this.isPanning) this.updatePan();

        if (this.isScrolling) this.updateDistance();

        this.performSimpleRotation();
    };
};

ripe.CSRControls.prototype.updatePan = function() {
    const xDiff = this.targetPan.x - this.currentPan.x;
    const yDiff = this.targetPan.y - this.currentPan.y;
    const zDiff = this.targetPan.z - this.currentPan.z;

    const continuesPanning =
        Math.abs(xDiff) > 0.01 || Math.abs(yDiff) > 0.01 || Math.abs(zDiff) > 0.01;

    // updates pan
    if (continuesPanning) {
        this.currentPan.x += xDiff / 5;
        this.currentPan.y += yDiff / 5;
        this.currentPan.z += zDiff / 5;
    } else {
        this.currentPan.copy(this.targetPan);
        this.isPanning = false;
    }
};

ripe.CSRControls.prototype.updateDistance = function() {
    const diff = this.targetDistance - this.currentDistance;

    // is still scrolling, update distance
    if (Math.abs(diff) > 0.01) {
        // if finished reset the variable
        this.currentDistance += diff / 5;
    } else {
        this.isScrolling = false;
        this.currentDistance = this.targetDistance;
    }
};

ripe.CSRControls.prototype.updateRotation = function() {
    const xDiff = this.targetRotation.x - this.currentRotation.x;
    const yDiff = this.targetRotation.y - this.currentRotation.y;

    const continuesRotating = Math.abs(xDiff) > 0.01 || Math.abs(yDiff) > 0.01;

    if (continuesRotating) {
        this.currentRotation.x += xDiff / 5;

        this.currentRotation.y = this.validVericalAngle(this.currentRotation.y + yDiff / 5);
    } else {
        this.isRotating = false;
        // reset angles to normal bounds
        this.currentRotation.x = this.validHorizontalAngle(this.currentRotation.x);
        this.currentRotation.y = this.validVericalAngle(this.currentRotation.y);

        this.targetRotation.x = this.validHorizontalAngle(this.targetRotation.x);
        this.targetRotation.y = this.validVericalAngle(this.targetRotation.y);
    }
};

ripe.CSRControls.prototype._parseScroll = function(event) {
    this.isScrolling = true;

    const increase = (this.maxDistance - this.minDistance) / 10;
    const diff = event.deltaY >= 0 ? increase : increase * -1;

    this.targetDistance = Math.max(
        Math.min(this.targetDistance + diff, this.maxDistance),
        this.minDistance
    );
};

ripe.CSRControls.prototype.deg2rad = function(degrees) {
    return degrees * (Math.PI / 180);
};

ripe.CSRControls.prototype._parsePan = function(event) {
    if (!this.element.classList.contains("drag")) this.element.classList.add("drag");

    this.isPanning = true;

    const newX = (event.x - this._previousPanEvent.x) / 100;
    const newY = (event.y - this._previousPanEvent.y) / 100;

    const radX = this.currentRotation.x * (Math.PI / 180);
    const radY = this.currentRotation.y * (Math.PI / 180);

    //            event.x impact                                event.x impact when with tilted camera                  event.y impact when with tilted camera
    const xDiff =
        newX * Math.cos(radX) * -1 * Math.cos(radY) +
        newX * Math.cos(radX) * Math.abs(Math.sin(radY)) * -1 +
        newY * Math.sin(radX) * Math.sin(radY);
    const zDiff =
        newX * Math.sin(radX) * -1 * Math.cos(radY) +
        newX * Math.sin(radX) * Math.abs(Math.sin(radY)) * -1 +
        newY * Math.cos(radX) * Math.sin(radY) * -1;
    this.targetPan.x += xDiff;
    this.targetPan.y += newY * Math.cos(radY);
    this.targetPan.z += zDiff;

    // after all the calculations are done, update the previous event
    this._previousPanEvent = event;
};

ripe.CSRControls.prototype._parseDrag = function(event) {
    this.isRotating = true;

    if (!this.element.classList.contains("drag")) this.element.classList.add("drag");

    let newX = 0;
    let newY = 0;

    // only use the rotation that matters according to the locked
    // rotation axis
    if (this.lockRotation !== "vertical") newX = event.x - this._previousRotEvent.x;

    if (this.lockRotation !== "horizontal") newY = event.y - this._previousRotEvent.y;

    this.targetRotation.x = this.targetRotation.x + newX;
    this.targetRotation.y = Math.min(
        Math.max(this.targetRotation.y + newY, this.minimumVerticalRot),
        this.maximumVerticalRot
    );

    // after all the calculations are done, update the previous event
    this._previousRotEvent = event;
};

/**
 * Updates the base angles based on either the current angles, or the parameters in the options
 * structure.
 *
 * @param {Object} options If specified, update the base and current angles based on the options.
 */
ripe.CSRControls.prototype._updateAngles = function(options = {}) {
    const newX = options.rotationX === undefined ? this.currentRotation.x : options.rotationX;
    const newY = options.rotationY === undefined ? this.currentRotation.y : options.rotationY;

    this.currentRotation.x = this._validatedAngle(newX);
    this.mouseDeltaX = 0;

    this.currentRotation.y = newY;
    this.mouseDeltaY = 0;
};

/**
 * * Converts a position of the element to a rotation that can be applied to
 * the model or the camera.
 *
 * @param {Number} position The position that is used for the conversion.
 * @returns {Number} The normalized rotation (degrees) for the given position.
 */
ripe.CSRControls.prototype.positionToRotation = function(position) {
    const viewFrames = 24;

    return (position / viewFrames) * 360;
};

/**
 * * Converts a position of the element to a rotation that can be applied to
 * the model or the camera.
 *
 * @param {Number} position The position that is used for the conversion.
 * @returns {Number} The normalized rotation (degrees) for the given position.
 */
ripe.CSRControls.prototype.viewToRotation = function(view) {
    const verticalThreshold = this.element.dataset.verticalThreshold || 85;

    if (view === "side") return 0;
    else return view === "top" ? verticalThreshold : verticalThreshold * -1;
};

/**
 * The function to handle a rotation transition between views and/or positions.
 *
 * @param {Object} options Options used for the transition.
 */
ripe.CSRControls.prototype.rotationTransition = async function(options) {
    let finalXRotation = parseInt(options.rotationX);
    const finalYRotation = parseInt(options.rotationY);

    const startingRotation = this.currentRotation.clone();
    const startingPan = this.currentPan.clone();
    const startingDistance = this.currentDistance;

    // figures out the best final rotation to avoid going through longest path
    const diff = finalXRotation - this.currentRotation.x;
    if (diff < -180) finalXRotation += 360;
    if (diff > 180) finalXRotation -= 360;

    this.element.classList.add("no-drag");
    this.element.classList.add("animating");

    let pos = 0;
    let startTime = 0;
    const duration = options.duration === undefined ? 500 : options.duration;

    const transition = time => {
        startTime = startTime === 0 ? time : startTime;
        pos = (time - startTime) / duration;

        this.currentRotation.x = ripe.easing.easeInOutQuad(pos, startingRotation.x, finalXRotation);
        this.currentRotation.y = ripe.easing.easeInOutQuad(pos, startingRotation.y, finalYRotation);

        this.currentDistance = ripe.easing.easeInOutQuad(
            pos,
            startingDistance,
            this.referenceCameraDistance
        );

        this.currentPan.x = ripe.easing.easeInOutQuad(
            pos,
            startingPan.x,
            this.referenceCameraTarget.x
        );
        this.currentPan.y = ripe.easing.easeInOutQuad(
            pos,
            startingPan.y,
            this.referenceCameraTarget.y
        );
        this.currentPan.z = ripe.easing.easeInOutQuad(
            pos,
            startingPan.z,
            this.referenceCameraTarget.z
        );

        this.performSimpleRotation();

        if (pos < 1) {
            requestAnimationFrame(transition);
        } else {
            // update the target to match the current rotation
            this.targetRotation.copy(this.currentRotation);
            this.targetPan.copy(this.currentPan);
            this.targetDistance = this.currentDistance;

            this.element.classList.remove("animating");
            this.element.classList.remove("no-drag");
        }
    };

    requestAnimationFrame(transition);
};

/**
 * The function to handle a rotation transition between views and/or positions.
 *
 * @param {Object} options Options used for the transition.
 */
ripe.CSRControls.prototype.recenterTransition = async function(targetPart) {
    // creates a 3D box from the target object to
    // be able to calculate it's the center
    const box = new this.csr.library.Box3().setFromObject(targetPart);
    const centerX = box.min.x + (box.max.x - box.min.x) / 2.0;
    const centerY = box.min.y + (box.max.y - box.min.y) / 2.0;
    const centerZ = box.min.z + (box.max.z - box.min.z) / 2.0;

    // set the max distance to take into account how large
    // the target object is
    const maxElement = Math.max(
        box.max.x - box.min.x,
        box.max.y - box.min.y,
        box.max.z - box.min.z
    );

    // take FOV into account, the higher it is, the
    // less distance it needs to be
    const endDistance = Math.max(
        Math.min(
            maxElement / 1.7 / Math.sin(this.deg2rad(this.csr.cameraFOV / 2)),
            this.maxDistance
        ),
        this.minDistance
    );

    const startDistance = this.currentDistance;

    const startingPan = this.currentPan.clone();

    this.element.classList.add("no-drag");
    this.element.classList.add("animating");

    let pos = 0;
    let startTime = 0;
    const duration = 500;

    const transition = time => {
        startTime = startTime === 0 ? time : startTime;
        pos = (time - startTime) / duration;

        this.currentPan.x = ripe.easing.easeInOutQuad(pos, startingPan.x, centerX);
        this.currentPan.y = ripe.easing.easeInOutQuad(pos, startingPan.y, centerY);
        this.currentPan.z = ripe.easing.easeInOutQuad(pos, startingPan.z, centerZ);

        this.currentDistance = ripe.easing.easeInOutQuad(pos, startDistance, endDistance);

        // rotate only the pan
        this.performSimpleRotation();

        if (pos < 1) {
            requestAnimationFrame(transition);
        } else {
            // update the target to match the current rotation
            this.targetDistance = this.currentDistance;
            this.targetPan.copy(this.currentPan);
            this.element.classList.remove("animating");
            this.element.classList.remove("no-drag");
        }
    };

    requestAnimationFrame(transition);
};

/**
 * Returns a valid horizontal angle to prevent going over 360 or under 0 degrees.
 *
 * @param {Number} angle The starting angle.
 */
ripe.CSRControls.prototype.validHorizontalAngle = function(angle) {
    let newAngle = angle;
    if (angle > 360) newAngle -= 360;
    if (angle < 0) newAngle += 360;

    return Math.min(Math.max(newAngle, this.minimumHorizontalRot), this.maximumHorizontalRot);
};

/**
 * Returns a valid horizontal angle to prevent going over 360 or under 0 degrees.
 *
 * @param {Number} angle The starting angle.
 */
ripe.CSRControls.prototype.validVericalAngle = function(angle) {
    let newAngle = angle;
    const maxAngle = 89;

    if (newAngle > maxAngle) newAngle = maxAngle;
    if (newAngle < maxAngle * -1) newAngle = maxAngle * -1;
    return Math.min(Math.max(this.minimumVerticalRot, newAngle), this.maximumVerticalRot);
};
