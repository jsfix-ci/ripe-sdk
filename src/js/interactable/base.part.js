Ripe.Interactable = function(ripe, element, options) {
    if (!element) {
        return;
    }

    this.ripe = ripe;
    this.element = element;
    this.options = options || {};

    this.init();
};

Ripe.Interactable.prototype.init = function() {
    this.callbacks = {};
    this.size = this.element.getAttribute("data-size") || options.size || 1000;
};

Ripe.Interactable.prototype.update = function() {};

Ripe.Interactable.prototype.mergeOptions = function(baseOptions, options) {};

Ripe.Interactable.prototype.changeFrame = function(frame, options) {};

Ripe.Interactable.prototype._addCallback = function(event, callback) {
    var callbacks = this.callbacks[event] || [];
    callbacks.push(callback);
    this.callbacks[event] = callbacks;
};

Ripe.Interactable.prototype._runCallbacks = function(event) {
    var callbacks = this.callbacks[event] || [];
    for (var index = 0; index < callbacks.length; index++) {
        var callback = callbacks[index];
        callback.apply(this, Array.prototype.slice.call(arguments, 1));
    }
};

Ripe.Interactable.prototype.addLoadedCallback = function(callback) {
    this._addCallback("loaded", callback);
};

Ripe.Interactable.prototype.addUpdatedCallback = function(callback) {};

Ripe.Interactable.prototype.addChangedFrameCallback = function(callback) {};
