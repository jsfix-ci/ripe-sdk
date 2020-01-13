const account = require("./account");
const brand = require("./brand");
const build = require("./build");
const config = require("./config");
const countryGroup = require("./country-group");
const justification = require("./justification");
const priceRule = require("./priceRule");
const locale = require("./locale");
const oauth = require("./oauth");
const order = require("./order");
const size = require("./size");
const sku = require("./sku");

Object.assign(module.exports, account);
Object.assign(module.exports, brand);
Object.assign(module.exports, build);
Object.assign(module.exports, config);
Object.assign(module.exports, countryGroup);
Object.assign(module.exports, justification);
Object.assign(module.exports, priceRule);
Object.assign(module.exports, locale);
Object.assign(module.exports, oauth);
Object.assign(module.exports, order);
Object.assign(module.exports, size);
Object.assign(module.exports, sku);
