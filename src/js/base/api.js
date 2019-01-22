if (typeof require !== "undefined") {
    // eslint-disable-next-line no-redeclare
    var base = require("./base");
    // eslint-disable-next-line no-redeclare
    var compat = require("./compat");
    require("./ripe");
    // eslint-disable-next-line no-redeclare
    var ripe = base.ripe;
    // eslint-disable-next-line no-redeclare
    var XMLHttpRequest = compat.XMLHttpRequest;
}

ripe.RipeAPI = function(options) {
    return new ripe.Ripe(null, null, options);
};

ripe.Ripe.prototype.signin = function(username, password, options, callback) {
    callback = typeof options === "function" ? options : callback;
    options = typeof options === "function" ? {} : options;
    const url = this.url + "signin";
    options = Object.assign(options, {
        url: url,
        method: "POST",
        params: {
            username: username,
            password: password
        }
    });
    options = this._build(options);
    return this._cacheURL(options.url, options, callback);
};

ripe.Ripe.prototype.getConfig = function(options, callback) {
    callback = typeof options === "function" ? options : callback;
    options = typeof options === "function" ? {} : options;
    options = this._getConfigOptions(options);
    options = this._build(options);
    return this._cacheURL(options.url, options, callback);
};

ripe.Ripe.prototype.getPrice = function(options, callback) {
    callback = typeof options === "function" ? options : callback;
    options = typeof options === "function" ? {} : options;
    options = this._getPriceOptions(options);
    options = this._build(options);
    return this._cacheURL(options.url, options, callback);
};

ripe.Ripe.prototype.getDefaults = function(options, callback) {
    callback = typeof options === "function" ? options : callback;
    options = typeof options === "function" ? {} : options;
    options = this._getDefaultsOptions(options);
    options = this._build(options);
    return this._cacheURL(options.url, options, function(result, isValid, request) {
        callback && callback(isValid ? result.parts : result, isValid, request);
    });
};

ripe.Ripe.prototype.getOptionals = function(options, callback) {
    return this.getDefaults(options, function(defaults, isValid, request) {
        const optionals = [];
        for (const name in defaults) {
            const part = defaults[name];
            part.optional && optionals.push(name);
        }
        callback && callback(optionals, isValid, request);
    });
};

ripe.Ripe.prototype.getCombinations = function(options, callback) {
    callback = typeof options === "function" ? options : callback;
    options = typeof options === "function" ? {} : options;
    options = this._getCombinationsOptions(options);
    options = this._build(options);
    return this._cacheURL(options.url, options, function(result, isValid, request) {
        callback && callback(isValid ? result.combinations : result, isValid, request);
    });
};

ripe.Ripe.prototype.getCombinationsP = function(options) {
    return new Promise((resolve, reject) => {
        this.getCombinations(options, (result, isValid, request) => {
            isValid ? resolve({ result: result, request: request }) : reject(new Error());
        });
    });
};

ripe.Ripe.prototype.getFactory = function(options, callback) {
    callback = typeof options === "function" ? options : callback;
    options = typeof options === "function" ? {} : options;
    options = this._getFactoryOptions(options);
    options = this._build(options);
    return this._cacheURL(options.url, options, callback);
};

ripe.Ripe.prototype.getLocaleModel = function(options, callback) {
    callback = typeof options === "function" ? options : callback;
    options = typeof options === "function" ? {} : options;
    options = this._getLocaleModelOptions(options);
    options = this._build(options);
    return this._cacheURL(options.url, options, callback);
};

ripe.Ripe.prototype.getLocaleModelP = function(options) {
    return new Promise((resolve, reject) => {
        this.getLocaleModel(options, (result, isValid, request) => {
            isValid ? resolve({ result: result, request: request }) : reject(new Error());
        });
    });
};

ripe.Ripe.prototype._cacheURL = function(url, options, callback) {
    // runs the defaulting operatin on the provided options
    // optional parameter (ensures valid object there)
    callback = typeof options === "function" ? options : callback;
    options = typeof options === "function" ? {} : options;

    // builds the (base) key value for the provided value
    // from options or used the default one
    const key = options.key || "default";

    // creates the full key by adding the base key to the
    // URL value (including query string), this is unique
    // assuming no request payload
    const query = this._buildQuery(options.params || {});
    const fullKey = key + ":" + url + ":" + query;

    // determines if the current request should be cached, obeys
    // some of the basic rules for that behaviour
    let cached = typeof options.cached === "undefined" ? true : options.cached;
    cached = cached && !options.force && ["GET"].indexOf(options.method || "GET") !== -1;

    // initializes the cache object in the current instance
    // in case it does not exists already
    this._cache = this._cache === undefined ? {} : this._cache;

    // in case there's already a valid value in cache,
    // retrieves it and calls the callback with the value
    if (this._cache[fullKey] !== undefined && cached) {
        callback && callback(this._cache[fullKey], true, null);
        return null;
    }

    // otherwise runs the "normal" request URL call and
    // sets the result cache key on return
    return this._requestURL(
        url,
        options,
        function(result, isValid, request) {
            if (isValid && cached) {
                this._cache[fullKey] = result;
            }
            callback && callback(result, isValid, request);
        }.bind(this)
    );
};

ripe.Ripe.prototype._requestURL = function(url, options, callback) {
    callback = typeof options === "function" ? options : callback;
    options = typeof options === "function" ? {} : options;

    const context = this;
    const method = options.method || "GET";
    const params = options.params || {};
    const headers = options.headers || {};
    let data = options.data || null;
    let contentType = options.contentType || null;

    const query = this._buildQuery(params);
    const isEmpty = ["GET", "DELETE"].indexOf(method) !== -1;
    const hasQuery = url.indexOf("?") !== -1;
    const separator = hasQuery ? "&" : "?";

    if (isEmpty || data) {
        url += separator + query;
    } else {
        data = query;
        contentType = "application/x-www-form-urlencoded";
    }

    const request = new XMLHttpRequest();

    request.addEventListener("load", function() {
        let result = null;
        const isValid = this.status === 200;
        try {
            result = JSON.parse(this.responseText);
        } catch (error) { }
        callback && callback.call(context, result, isValid, this);
    });

    request.addEventListener("loadstart", function() {
        context.trigger("pre_request", request, options);
    });

    request.addEventListener("loadend", function() {
        context.trigger("post_request", request, options);
    });

    request.open(method, url);
    for (const key in headers) {
        const value = headers[key];
        request.setRequestHeader(key, value);
    }
    if (contentType) {
        request.setRequestHeader("Content-Type", contentType);
    }

    this.trigger("build_request", request, options);

    if (data) {
        request.send(data);
    } else {
        request.send();
    }
    return request;
};

ripe.Ripe.prototype._getQueryOptions = function(options) {
    options = options || {};

    const params = options.params || {};
    options.params = params;

    const brand = options.brand === undefined ? this.brand : options.brand;
    const model = options.model === undefined ? this.model : options.model;
    const variant = options.variant === undefined ? this.variant : options.variant;
    const frame = options.frame === undefined ? this.frame : options.frame;
    const parts = options.parts === undefined ? this.parts : options.parts;
    const engraving = options.engraving === undefined ? this.engraving : options.engraving;
    const country = options.country === undefined ? this.country : options.country;
    const currency = options.currency === undefined ? this.currency : options.currency;
    const flag = options.flag === undefined ? this.flag : options.flag;

    if (brand !== undefined && brand !== null) {
        params.brand = brand;
    }

    if (model !== undefined && model !== null) {
        params.model = model;
    }

    if (variant !== undefined && variant !== null) {
        params.variant = variant;
    }

    if (frame !== undefined && frame !== null) {
        params.frame = frame;
    }

    if (engraving !== undefined && engraving !== null) {
        params.engraving = engraving;
    }

    if (country !== undefined && country !== null) {
        params.country = country;
    }

    if (currency !== undefined && currency !== null) {
        params.currency = currency;
    }

    if (flag !== undefined && flag !== null) {
        params.flag = flag;
    }

    params.p = [];

    for (const part in parts) {
        const value = parts[part];
        const material = value.material;
        const color = value.color;
        if (!material) {
            continue;
        }
        if (!color) {
            continue;
        }
        params.p.push(part + ":" + material + ":" + color);
    }

    return options;
};

ripe.Ripe.prototype._getQuery = function(options) {
    options = this._getQueryOptions(options);
    return this._buildQuery(options.params);
};

ripe.Ripe.prototype._getConfigOptions = function(options) {
    options = options || {};
    const brand = options.brand === undefined ? this.brand : options.brand;
    const model = options.model === undefined ? this.model : options.model;
    const country = options.country === undefined ? this.country : options.country;
    const flag = options.flag === undefined ? this.flag : options.flag;
    const url = this.url + "brands/" + brand + "/models/" + model + "/config";
    const params = {};
    if (country !== undefined && country !== null) {
        params.country = country;
    }
    if (flag !== undefined && flag !== null) {
        params.flag = flag;
    }
    if (options.filter !== undefined && options.filter !== null) {
        params.filter = options.filter ? "1" : "0";
    }
    return Object.assign(options, {
        url: url,
        method: "GET",
        params: params
    });
};

ripe.Ripe.prototype._getPriceOptions = function(options) {
    options = options || {};
    const url = this.url + "config/price";
    options = this._getQueryOptions(options);
    return Object.assign(options, {
        url: url,
        method: "GET"
    });
};

ripe.Ripe.prototype._getDefaultsOptions = function(options) {
    options = options || {};
    const brand = options.brand === undefined ? this.brand : options.brand;
    const model = options.model === undefined ? this.model : options.model;
    const url = this.url + "brands/" + brand + "/models/" + model + "/defaults";
    return Object.assign(options, {
        url: url,
        method: "GET"
    });
};

ripe.Ripe.prototype._getCombinationsOptions = function(options) {
    options = options || {};
    const brand = options.brand === undefined ? this.brand : options.brand;
    const model = options.model === undefined ? this.model : options.model;
    const useName =
        options.useName !== undefined && options.useName !== null ? options.useName : false;
    const country = options.country === undefined ? this.country : options.country;
    const flag = options.flag === undefined ? this.flag : options.flag;
    const url = this.url + "brands/" + brand + "/models/" + model + "/combinations";
    const params = {};
    if (useName !== undefined && useName !== null) {
        params.use_name = useName ? "1" : "0";
    }
    if (country !== undefined && country !== null) {
        params.country = country;
    }
    if (flag !== undefined && flag !== null) {
        params.flag = flag;
    }
    if (options.resolve !== undefined && options.resolve !== null) {
        params.resolve = options.resolve ? "1" : "0";
    }
    if (options.sort !== undefined && options.sort !== null) {
        params.sort = options.sort ? "1" : "0";
    }
    if (options.filter !== undefined && options.filter !== null) {
        params.filter = options.filter ? "1" : "0";
    }
    return Object.assign(options, {
        url: url,
        method: "GET",
        params: params
    });
};

ripe.Ripe.prototype._getFactoryOptions = function(options) {
    options = options || {};
    const brand = options.brand === undefined ? this.brand : options.brand;
    const model = options.model === undefined ? this.model : options.model;
    const url = this.url + "brands/" + brand + "/models/" + model + "/factory";
    return Object.assign(options, {
        url: url,
        method: "GET"
    });
};

ripe.Ripe.prototype._getLocaleModelOptions = function(options) {
    options = options || {};
    const brand = options.brand === undefined ? this.brand : options.brand;
    const model = options.model === undefined ? this.model : options.model;
    const locale =
        options.locale !== undefined && options.locale !== null ? options.locale : this.locale;
    const url = this.url + "builds/" + brand + "/locale/" + locale;
    const params = {};
    if (model !== undefined && model !== null) {
        params.model = model;
    }
    if (options.compatibility !== undefined && options.compatibility !== null) {
        params.compatibility = options.compatibility ? "1" : "0";
    }
    if (options.prefix !== undefined && options.prefix !== null) {
        params.prefix = options.prefix;
    }
    return Object.assign(options, {
        url: url,
        method: "GET",
        params: params
    });
};

ripe.Ripe.prototype._getImageOptions = function(options) {
    options = options || {};
    options.country = options.country || null;
    options.currency = options.currency || null;

    options = this._getQueryOptions(options);

    const params = options.params || {};
    options.params = params;

    if (options.format !== undefined && options.format !== null) {
        params.format = options.format;
    }

    if (options.width !== undefined && options.width !== null) {
        params.width = options.width;
    }

    if (options.height !== undefined && options.height !== null) {
        params.height = options.height;
    }

    if (options.size !== undefined && options.size !== null) {
        params.size = options.size;
    }

    if (options.background !== undefined && options.background !== null) {
        params.background = options.background;
    }

    if (options.crop !== undefined && options.crop !== null) {
        params.crop = options.crop ? "1" : "0";
    }

    if (options.profile !== undefined && options.profile !== null) {
        params.initials_profile = options.profile.join(",");
    }

    const initials = options.initials === "" ? "$empty" : options.initials;
    if (options.initials !== undefined && options.initials !== null) {
        params.initials = initials;
    }

    const url = this.url + "compose";

    return Object.assign(options, {
        url: url,
        method: "GET",
        params: params
    });
};

ripe.Ripe.prototype._getMaskOptions = function(options) {
    options = options || {};
    options.parts = options.parts || {};
    options.country = options.country || null;
    options.currency = options.currency || null;

    options = this._getQueryOptions(options);

    const params = options.params || {};
    options.params = params;

    if (options.part !== undefined && options.part !== null) {
        params.part = options.part;
    }

    const url = this.url + "mask";

    return Object.assign(options, {
        url: url,
        method: "GET",
        params: params
    });
};

ripe.Ripe.prototype._getImageURL = function(options) {
    options = this._getImageOptions(options);
    return options.url + "?" + this._buildQuery(options.params);
};

ripe.Ripe.prototype._getMaskURL = function(options) {
    options = this._getMaskOptions(options);
    return options.url + "?" + this._buildQuery(options.params);
};

ripe.Ripe.prototype._build = function(options) {
    const url = options.url || "";
    const method = options.method || "GET";
    const params = options.params || {};
    const auth = options.auth || false;
    if (auth && this.sid !== undefined && this.sid !== null) {
        params.sid = this.sid;
    }
    options.url = url;
    options.method = method;
    options.params = params;
    options.auth = auth;
    return options;
};

ripe.Ripe.prototype._buildQuery = function(params) {
    let key;
    let value;
    let index;
    const buffer = [];

    if (Array.isArray(params)) {
        for (index = 0; index < params.length; index++) {
            const tuple = params[index];
            key = tuple[0];
            value = tuple.length > 1 ? tuple[1] : "";
            key = encodeURIComponent(key);
            value = encodeURIComponent(value);
            buffer.push(key + "=" + value);
        }
    } else {
        const keys = Object.keys(params);
        keys.sort();
        for (index = 0; index < keys.length; index++) {
            key = keys[index];
            value = params[key];
            key = encodeURIComponent(key);
            if (Array.isArray(value)) {
                for (let _index = 0; _index < value.length; _index++) {
                    let _value = value[_index];
                    _value = encodeURIComponent(_value);
                    buffer.push(key + "=" + _value);
                }
            } else {
                value = encodeURIComponent(value);
                buffer.push(key + "=" + value);
            }
        }
    }

    return buffer.join("&");
};

/**
 * Unpacks the provided query string into it's components inside
 * a key, value object for easy usage.
 *
 * @param {String} The GET query string that is going to be parsed
 * for the creation of the output Object.
 * @returns {Object} The object that contains the key, value information
 * on the query string.
 */
ripe.Ripe.prototype._unpackQuery = function(query) {
    query = query[0] === "?" ? query.slice(1) : query;

    const parts = query.split("&");
    const options = {};

    for (let index = 0; index < parts.length; index++) {
        const part = parts[index];

        if (part.indexOf("=") === -1) {
            options[decodeURIComponent(part).trim()] = true;
        } else {
            const tuple = part.split("=");
            const key = decodeURIComponent(tuple[0]).trim();
            const value = decodeURIComponent(tuple[1]).trim();
            options[key] = value;
        }
    }

    return options;
};
