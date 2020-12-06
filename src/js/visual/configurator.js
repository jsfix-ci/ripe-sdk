if (
    typeof require !== "undefined" &&
    (typeof window === "undefined" ||
        // eslint-disable-next-line camelcase
        typeof __webpack_require__ !== "undefined" ||
        (typeof navigator !== "undefined" && navigator.product === "ReactNative"))
) {
    // eslint-disable-next-line no-redeclare,no-var
    var base = require("../base");
    require("./configurator-prc");
    require("./configurator-csr");
    // eslint-disable-next-line no-redeclare,no-var
    var ripe = base.ripe;
}

ripe.Configurator = ripe.ConfiguratorPRC;

ripe.Configurator.prototype = ripe.ConfiguratorPRC.prototype;
ripe.Configurator.prototype.constructor = ripe.Configurator;
