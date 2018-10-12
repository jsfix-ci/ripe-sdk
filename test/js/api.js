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

            assert.deepStrictEqual(result.fr, ["female"]);
            assert.deepStrictEqual(result.uk, ["male", "female"]);
        });
    });

    describe("#sizeToNative", function() {
        it("should be able to convert sizes", async () => {
            let result = null;

            const remote = ripe.RipeAPI();

            result = await new Promise((resolve, reject) => {
                remote.sizeToNative("fr", 42, "female", resolve);
            });

            assert.strictEqual(result.scale, "fr");
            assert.strictEqual(result.value, 31);
            assert.strictEqual(result.native, 31);
        });
    });

    describe("#sizeToNativeB", function() {
        it("should be able to convert sizes in bulk", async () => {
            let result = null;

            const remote = ripe.RipeAPI();

            result = await new Promise((resolve, reject) => {
                remote.sizeToNativeB(["fr"], [42], ["female"], resolve);
            });

            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].scale, "fr");
            assert.strictEqual(result[0].value, 31);
            assert.strictEqual(result[0].native, 31);
        });
    });

    describe("#nativetoSize", function() {
        it("should be able to convert sizes", async () => {
            let result = null;

            const remote = ripe.RipeAPI();

            result = await new Promise((resolve, reject) => {
                remote.nativeToSize("fr", 31, "female", resolve);
            });

            assert.strictEqual(result.value, 42);
        });
    });

    describe("#nativetoSizeB", function() {
        it("should be able to convert sizes in bulk", async () => {
            let result = null;

            const remote = ripe.RipeAPI();

            result = await new Promise((resolve, reject) => {
                remote.nativeToSizeB(["fr"], [31], ["female"], resolve);
            });

            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].value, 42);
        });
    });

    describe("#getOrders", function() {
        it("should be able to retrieve orders", async () => {
            let result = null;

            const remote = ripe.RipeAPI();

            result = await new Promise((resolve, reject) => {
                remote.auth("root", "root", resolve);
            });

            assert.strictEqual(result.username, "root");
            assert.notStrictEqual(typeof result.sid, undefined);

            result = await new Promise((resolve, reject) => {
                remote.getOrders(resolve);
            });

            assert.notStrictEqual(result.length, 0);
        });
    });

    describe("#getOrder", function() {
        it("should be able to retrieve an order information", async () => {
            let result = null;

            const remote = ripe.RipeAPI();

            result = await new Promise((resolve, reject) => {
                remote.auth("root", "root", resolve);
            });

            assert.strictEqual(result.username, "root");
            assert.notStrictEqual(typeof result.sid, undefined);

            result = await new Promise((resolve, reject) => {
                remote.getOrder(853, resolve);
            });

            assert.strictEqual(result.number, 853);
            assert.strictEqual(result.number_s, "#000853");
        });
    });

    describe("#_getConfigOptions", function() {
        it("should include country in params", async () => {
            let result = null;

            const remote = ripe.RipeAPI({
                country: "PT"
            });
            result = remote._getConfigOptions({
                brand: "swear",
                model: "vyner"
            });

            assert.strictEqual(result.url, "https://sandbox.platforme.com/api/brands/swear/models/vyner/config");
            assert.strictEqual(result.params.country, "PT");
        });
    });

    describe("#_buildQuery", function() {
        it("should correctly generate a query string from array", async () => {
            let result = null;

            const remote = ripe.RipeAPI();
            result = remote._buildQuery([["hello", "world"]]);

            assert.strictEqual(result, "hello=world");
        });

        it("should correctly generate a query string from object", async () => {
            let result = null;

            const remote = ripe.RipeAPI();
            result = remote._buildQuery({
                hello: "world"
            });

            assert.strictEqual(result, "hello=world");
        });

        it("should correctly generate a query string from a complex array", async () => {
            let result = null;

            const remote = ripe.RipeAPI();
            result = remote._buildQuery([
                ["hello", "world"],
                ["hello", "world2"],
                ["world", "hello"],
                ["world", "hello2"]
            ]);

            assert.strictEqual(result, "hello=world&hello=world2&world=hello&world=hello2");
        });

        it("should correctly generate a query string from a complex object", async () => {
            let result = null;

            const remote = ripe.RipeAPI();
            result = remote._buildQuery({
                hello: ["world", "world2"],
                world: ["hello", "hello2"]
            });

            assert.strictEqual(result, "hello=world&hello=world2&world=hello&world=hello2");
        });

        it("should properly escape characters", async () => {
            let result = null;

            const remote = ripe.RipeAPI();
            result = remote._buildQuery([["olá", "mundo"]]);

            assert.strictEqual(result, "ol%C3%A1=mundo");
        });
    });

    describe("#_unpackQuery", function() {
        it("should properly unescape characters", async () => {
            let result = null;

            const remote = ripe.RipeAPI();
            result = remote._unpackQuery("ol%C3%A1=mundo");

            assert.deepStrictEqual(result, { olá: "mundo" });
        });
    });
});
