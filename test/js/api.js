const assert = require("assert");
const config = require("./config");
const ripe = require("../../src/js");

describe("RipeAPI", function() {
    this.timeout(config.TEST_TIMEOUT);

    describe("#getSizes", function() {
        it("should be able to retrieve sizes", async () => {
            let result = null;

            const remote = ripe.RipeAPI();

            result = await new Promise((resolve, reject) => {
                remote.getSizes(resolve);
            });

            assert.deepEqual(result.fr, ["female"]);
            assert.deepEqual(result.uk, ["female", "male"]);
        });
    });

    describe("#sizeToNative", function() {
        it("should be able to convert sizes", async () => {
            let result = null;

            const remote = ripe.RipeAPI();

            result = await new Promise((resolve, reject) => {
                remote.sizeToNative("fr", 42, "female", resolve);
            });

            assert.equal(result.scale, "fr");
            assert.equal(result.value, 31);
            assert.equal(result.native, 31);
        });
    });

    describe("#getOrders", function() {
        it("should be able to retrieve orders", async () => {
            let result = null;

            const remote = ripe.RipeAPI();

            result = await new Promise((resolve, reject) => {
                remote.auth("root", "root", resolve);
            });

            assert.equal(result.username, "root");
            assert.notEqual(typeof result.sid, undefined);

            result = await new Promise((resolve, reject) => {
                remote.getOrders(resolve);
            });

            assert.notEqual(result.length, 0);
        });
    });
});
