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
    this.viewAnimate = options.viewAnimate;

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

    this._previousEvent = null;

    this.viewAnimate = "crossfade";
    this.positionAnimate = "rotate";

    this._setControlsOptions(options);
    this._registerHandlers();

    this._referenceCameraTarget = this.csr.cameraTarget;
    this._referenceCameraDistance = this.csr.initialDistance;

    // distance variables
    this.targetDistance = this.csr.initialDistance;
    this.currentDistance = this.csr.initialDistance;

    // rotation variables
    const startingPosition = options.position || 0;
    const initialXRot = this._positionToRotation(startingPosition);

    this.targetRotation = new this.csr.library.Vector2(initialXRot, 0);
    this.currRotation = this.targetRotation.clone();

    // camera target and panning variables
    this.isPanning = false;
    this.panTarget = this._referenceCameraTarget.clone();

    // smooth rotation timers
    this.isRotating = false;
    this.startingRotTime = -1;

    // smooth scroll timers, scroll time is constant
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

    this.viewAnimate = options.viewAnimate === undefined ? this.viewAnimate : options.viewAnimate;
    this.positionAnimate =
        options.positionAnimate === undefined ? this.positionAnimate : options.positionAnimate;

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
 * Function to perform a rotation. Assesses whether a transition
 * is necessary, and if so, calls the correct function to handle the transition depending
 * on the Configurator's settings.
 * @param {Object} options Set of parameters that guide the rotation such as:
 * - 'rotationX' - The new horizontal rotation for the camera.
 * - 'rotationY' - The new vertical rotation for the camera.
 * - 'distance' - The new camera distance.
 */
ripe.CSRControls.prototype._applyRotations = async function(newView, newPos) {
    const options = {
        rotationX: this.currRotation.x,
        rotationY: this.currRotation.y,
        distance: this.currentDistance
    };

    // checks to see if transition is required, and delegates
    // the transition to the controls in case of rotation, and
    // the renderer in case of a crossfade
    if (this.element.dataset.view !== newView) {
        if (this.viewAnimate === "crossfade") {
            console.log("1");
            await this.csr.crossfade(options, "rotation");
            // updates the internal angles of the controls after
            // the crossfade finishes
            // this._updateAngles(options);
        } else if (this.viewAnimate === "rotate") {
            console.log("2");
            this.rotationTransition(options);
        } else if (this.viewAnimate === "none") {
            console.log("3");
            this.csr.rotate(options);
        }
    } else if (this.element.dataset.position !== newPos) {
        if (this.positionAnimate === "crossfade") {
            console.log("4");
            await this.csr.crossfade(options, "rotation");

            this._updateAngles(options);
        } else if (this.positionAnimate === "rotate") {
            console.log("5");
            this.rotationTransition(options);
        } else if (this.positionAnimate === "none") {
            console.log("6");
            this.csr.rotate(options);
        }
    }

    // update configurator view and position variables
    this.configurator.updateViewPosition(newPos, newView);
};

/**
 * @ignore
 */
ripe.CSRControls.prototype.updateOptions = async function(options) {
    this.element = options.element === undefined ? this.element : options.element;

    const startingPosition =
        options.position === undefined ? this.element.position : options.position;
    this.currRotation.x = this._positionToRotation(startingPosition);
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

        self._previousEvent = event;
        _element.dataset.view = _element.dataset.view || "side";
        self.base = parseInt(_element.dataset.position) || 0;

        // differentiate between normal click and middle click
        // as the latter pans and not
        if (event.which === 2 && self.canPan) {
            self.middleDown = true;
        } else {
            self.down = true;
        }

        self.referenceX = event.pageX;
        self.referenceY = event.pageY;
        self.percent = 0;
        _element.classList.add("drag");
    });

    // listens for mouseup events and if it occurs then
    // stops reacting to mouse move events has drag movements
    area.addEventListener("mouseup", function(event) {
        const _element = self.element;
        self.down = false;
        self.middleDown = false;
        self.previous = self.percent;
        self.percent = 0;
        _element.classList.remove("drag");

        event = ripe.fixEvent(event);

        self._previousEvent = undefined;
    });

    // listens for mouse leave events and if it occurs then
    // stops reacting to mousemove events has drag movements
    area.addEventListener("mouseout", function(event) {
        this.classList.remove("drag");
        self.previous = self.percent;
        self.percent = 0;

        const animating = self.element.classList.contains("animating");

        if (animating) return;

        self.down = false;
    });

    // listens for mouse enter events and if it occurs then
    // resets the current parameters
    area.addEventListener("mouseenter", function(event) {
        self.down = false;
        self.middleDown = false;
        self.previous = self.percent;
        self.percent = 0;
    });

    // if a mouse move event is triggered while the mouse is
    // pressed down then updates the position of the drag element
    area.addEventListener("mousemove", function(event) {
        if (self.down) {
            self._parseDrag(event);
        } else if (self.middleDown) {
            self._parsePan(event);
        } else {
            // if it is not dragging
            self.targetDiffX = 0;
            self.targetDiffY = 0;
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
        rotationX: this.currRotation.x,
        rotationY: this.currRotation.y,
        distance: this.currentDistance
    };

    this.csr.rotate(options);
};

ripe.CSRControls.prototype.createLoop = function() {
    this.rotationLoop = () => {
        // apply simple rotations and translations if smooth controls
        // are disabled
        if (!this.smoothControls) {
            this.currentDistance = this.targetDistance;
            this.currRotation.x = this.validHorizontalAngle(
                this.targetRotation.x + this.currRotation.x
            );
            this.currRotation.y = Math.min(
                Math.max(this.minimumVerticalRot, this.currRotation.y + this.targetRotation.y),
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
        // panning and rotating are mutually exclusive, as the camera
        // target would be inconsistent
        // rotation takes priority
        else if (this.isPanning) this.updatePan();

        if (this.isScrolling) this.updateDistance();

        this.performSimpleRotation();
    };
};

ripe.CSRControls.prototype.updatePan = function() {
    // updates pan
    if (!this.panTarget.equals(this.currentPan)) {
        // console.log("panning?")
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
    const diffX = this.targetRotation.x - this.currRotation.x;
    const diffY = this.targetRotation.y - this.currRotation.y;

    const continuesRotating = Math.abs(diffX) > 0.01 || Math.abs(diffY) > 0.01;

    if (continuesRotating) {
        this.currRotation.x += diffX / 5;

        this.currRotation.y = this.validVericalAngle(this.currRotation.y + diffY / 5);
    } else {
        this.isRotating = false;
        // reset angles to normal bounds
        this.currRotation.x = this.validHorizontalAngle(this.currRotation.x);
        this.currRotation.y = this.validVericalAngle(this.currRotation.y);

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

ripe.CSRControls.prototype._parsePan = function(event) {
    console.log(event);
};

ripe.CSRControls.prototype._parseDrag = function(event) {
    this.isRotating = true;

    // set the new values as the normal
    // this.baseRotation.set(this.targetRotation.x, this.targetRotation.y)

    let newX = 0;
    let newY = 0;

    // only use the rotation that matters according to the locked
    // rotation axis
    if (this.lockRotation !== "vertical") newX = event.x - this._previousEvent.x;

    if (this.lockRotation !== "horizontal") newY = event.y - this._previousEvent.y;

    this.targetRotation.x = this.targetRotation.x + newX;
    this.targetRotation.y = Math.min(
        Math.max(this.targetRotation.y + newY, this.minimumVerticalRot),
        this.maximumVerticalRot
    );

    // after all the calculations are done, update the previous event
    this._previousEvent = event;
};

/**
 * Updates the base angles based on either the current angles, or the parameters in the options
 * structure.
 *
 * @param {Object} options If specified, update the base and current angles based on the options.
 */
ripe.CSRControls.prototype._updateAngles = function(options = {}) {
    const newX = options.rotationX === undefined ? this.currRotation.x : options.rotationX;
    const newY = options.rotationY === undefined ? this.currRotation.y : options.rotationY;

    this.currRotation.x = this._validatedAngle(newX);
    this.mouseDeltaX = 0;

    this.currRotation.y = newY;
    this.mouseDeltaY = 0;
};

/**
 * * Converts a position of the element to a rotation that can be applied to
 * the model or the camera.
 *
 * @param {Number} position The position that is used for the conversion.
 * @returns {Number} The normalized rotation (degrees) for the given position.
 */
ripe.CSRControls.prototype._positionToRotation = function(position) {
    const viewFrames = 24;

    return (position / viewFrames) * 360;
};

/**
 * Converts a rotation to a position.
 *
 * @param {Number} rotationX The rotation that is used for the conversion.
 * @returns {Number} The normalized position for the provided rotation (degrees).
 */
ripe.CSRControls.prototype._rotationToPosition = function(rotationX) {
    const viewFrames = 24;

    return (this.validHorizontalAngle(parseInt(rotationX)) / 360) * viewFrames;
};

/**
 * Maps a vertical rotation to a view.
 *
 * @param {Number} rotationY The rotation to be converted into a view.
 * @returns {String} The normalized view value for the given Y rotation.
 */
ripe.CSRControls.prototype._rotationToView = function(rotationY) {
    const verticalThreshold = this.element.dataset.verticalThreshold || 85;
    // if the drag was vertical then alters the
    // view if it is supported by the product
    const view = this.element.dataset.view;

    if (rotationY > verticalThreshold) {
        return view === "top" ? "side" : "bottom";
    }
    if (rotationY < verticalThreshold * -1) {
        return view === "bottom" ? "side" : "top";
    } else return view;
};

/**
 * Called when a changeFrame event is registered, and updates the angles based on the
 * new frame.
 *
 * @param {String} frame The new frame.
 * @param {Object} options Options to be used for the change.
 */
ripe.CSRControls.prototype.changeFrameRotation = async function(frame, options) {
    const _frame = ripe.parseFrameKey(frame);

    const animating = this.element.classList.contains("animating");

    // parses the requested frame value according to the pre-defined
    // standard (eg: side-3) and then unpacks it as view and position
    const nextView = _frame[0];
    const nextPosition = parseInt(_frame[1]);
    const position = parseInt(this.element.dataset.position);
    const view = this.element.dataset.view;

    // Nothing has changed, or is performing other transition
    if ((view === nextView && position === nextPosition) || animating) return false;

    // unpacks the other options to the frame change defaulting their values
    // in case undefined values are found
    let duration = options.duration === undefined ? null : options.duration;
    duration = duration || this.duration;
    const revolutionDuration = options.revolutionDuration;

    const nextHorizontalRot = this._positionToRotation(nextPosition);

    if (revolutionDuration) {
        duration = revolutionDuration;

        const current = this.validHorizontalAngle(this.currRotation.x);
        const next = this.validHorizontalAngle(nextHorizontalRot);
        const diff = Math.abs(next - current);

        duration = (diff * revolutionDuration) / 360;
        duration = 500;
    }

    // new rotation values
    let nextVerticalRot = 0;

    if (nextView === "top") nextVerticalRot = this.maximumVerticalRot;
    if (nextView === "bottom") nextVerticalRot = this.minimumVerticalRot;

    if (view !== nextView) this.currentDistance = this._basecurrentDistance;

    // sends command to configurator to rotate, so it can handle
    // the event appropriately
    await this._applyRotations(nextView, nextPosition);
};

/**
 * The function to handle a rotation transition between views and/or positions.
 *
 * @param {Object} options Options used for the transition.
 */
ripe.CSRControls.prototype.rotationTransition = async function(options) {
    const position = parseInt(this.element.dataset.position);
    const view = this.element.dataset.view;

    let finalXRotation = parseInt(options.rotationX);
    let finalYRotation = parseInt(options.rotationY);

    const nextView = this._rotationToView(finalYRotation);
    const nextPosition = this._rotationToPosition(finalXRotation);

    const baseRotation = this.currRotation.clone();
    const baseDistance = this.currentDistance;

    let pos = 0;
    let startTime = 0;

    const transition = time => {
        startTime = startTime === 0 ? time : startTime;
        pos = (time - startTime) / options.duration;

        this.currRotation.x = ripe.easing[this.rotationEasing](pos, baseRotation.x, finalXRotation);
        this.currRotation.y = ripe.easing[this.rotationEasing](pos, baseRotation.y, finalYRotation);

        this.currentDistance = ripe.easing[this.rotationEasing](
            pos,
            baseDistance,
            this._basecurrentDistance
        );

        this.performSimpleRotation();

        if (pos < 1) {
            requestAnimationFrame(transition);
        } else {
            this.element.classList.remove("animating");
            this.element.classList.remove("no-drag");
        }
    };

    if (view !== nextView) {
        finalYRotation = 0;

        if (nextView === "top") finalYRotation = this.maximumVerticalRot;
        if (nextView === "bottom") finalYRotation = this.minimumVerticalRot;
    }
    if (position !== nextPosition) {
        finalXRotation = this._positionToRotation(nextPosition);

        // figures out the best final rotation to avoid going through longest path
        const diff = finalXRotation - this.currRotation.x;
        if (diff < -180) finalXRotation += 360;
        if (diff > 180) finalXRotation -= 360;
    }

    this.element.classList.add("no-drag");
    this.element.classList.add("animating");
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
