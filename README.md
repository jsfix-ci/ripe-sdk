# RIPE SDK

The public SDK for [RIPE Core](https://github.com/ripe-tech/ripe-core).

## 1. Initialization


As a starting point, you need to provide the `brand` and `model` of your customizable product.
You may also pass an [`options`](#options) map to override parameters like the base `url` of the server where the product is configured, as well as `currency` and `country`, which are 'EUR' and 'US' respectively by default.

```javascript
var ripe = new Ripe(brand, model, {
    variant: variant,
    url: url,
    currency: currency,
    country: country
});
```

## 2. Events

After initializing the Ripe object you should subscribe to the available events so you can easily respond and update your UI.

### Update

Triggered whenever there is a customization change (eg: the color of a part is changed).

```javascript
ripe.bind("update", function() {
    updateUI();
});
```

### Price

Notifies you when the price of the customization changes.

```javascript
ripe.bind("price", function(value) {
    var price = document.getElementById("price");
    price.innerHTML = value.total.price_final + " " + value.total.currency;
});
```

### Combinations

Called when the possible customization combinations of the product are loaded. Each combination is a triplet formed by `part`, `material` and `color`. You should use this to populate the customization options on your UI.

```javascript
ripe.bind("combinations", function(value) {
    for (var index = 0; index < value.length; index++) {
        var triplet = value[index];
        var part = triplet[0];
        var material = triplet[1];
        var color = triplet[2];
        addOption(part, material, color);
    }
});
```

### Parts

Notifies you when all the product's parts have changed.

```javascript
ripe.bind("parts", function(parts) {
    parts && showPartsPicker(parts);
});
```

### Frames

Triggered whenever there is a frame change.

```javascript
configurator.bind("changed_frame", function(frame) {
    frame === "top" && disableButton("top-view-button");
});
```

## 3. Product visualization

Usually the product has 24 lateral frames, plus a top and bottom view.
To display any frame of the product you can use the `bindImage` function to automatically update an `<img>` element. This method also contains an `options` parameter.
Subscribe to the event `loaded` and you will know when your image is loaded.
Finally, after the initial binding of the frames you should call the `load` function for the initial update.

```javascript
var element = document.getElementById("frame-0")
var image = ripe.bindImage(element, {
    frame: "side-0"
});

image.bind("loaded", function(frame) {
    console.log("frame " + frame + " loaded")
});

ripe.load();
```

Whenever you want to set a new image frame, you only have to call `setFrame` function.
```javascript
    image.setFrame("side-3");
```

## 4. Product customization

You can change a part of your product by using the `setPart` function.
Alternatively, multiple parts can be changed at once with `setParts`.

```javascript
ripe.setPart(part, material, color);
ripe.setParts([
    [part, material, color],
    [part, material, color]
]);
```

### Getters

If you need to explicitly retrieve the product's customization information you can use the following methods:

- `getConfig`: to get information about the product's model.
- `getCombinations`: to get all the customization options for products without any restrictions applied.
- `getDefaults`: to get the product's default customization.
- `getFrames`: to get all the product's frames.
- `getPrice`: to get the product's pricing information.

These functions receive a callback function as a parameter as shown below:
```javascript
ripe.getPrice(function(value) {
    var price = document.getElementById("price");
    price.innerHTML = value.total.price_final + " " + value.total.currency;
});
```

## 5. Product interaction

To provide an interactive product visualization you simply need to pass a `<div>` element to the method `bindConfigurator`.
Subscribe to the event `loaded` and you will know when your configurator is loaded.

This element supports the following methods:

| Method | Params | Description |
| --- | --- | --- |
| `changeFrame` | <ul><li>`frame` *(string), named frame defined in the "view-position" format. Eg.: "side-0"*</li><li>`options` *(JSON object with optional fields)*:  `duration`: *(number)* total duration, in milliseconds, of the animation; `type`: *(string)* the animation style you want, wich can be "simple" (fade in), "cross" (crossfade) or null (without any style)*; `preventDrag`: *(boolean)* to choose if drag actions during an animated change of frames should be ignored. "True" by default</li></ul> | displays a new frame, with an animation from the starting frame |

```javascript
var element = document.getElementById("config");
var configurator = ripe.bindConfigurator(element, {});

configurator.bind("loaded", function() {
    this.changeFrame("side-11", {
        duration: 500
    });
});
```

## Appendix

### Options

| Name | Type | Description |
| --- | --- | --- |
| `country` | *string* | Two letters standard country codes defined in *ISO 3166-1 alpha-2* codes. "US" by default. Example: "PT" |
| `currency` | *string* | Standard currency codes defined in *ISO 4217* codes. "USD" by default. Example: "EUR" |
| `frames` | *array of strings* | All the frames to be used in the customization. Example: ["top", "bottom", "1", "2"] |
| `maxSize` | *number* | Maximum value for frame image size. 1000px by default |
| `noCombinations` | *boolean* | Defines if the combinations are loaded or not. False (loading) by default |
| `noDefaults` | *boolean* | Defines if the defaults are loaded or not. False (loading) by default |
| `parts` | *JSON Object* | Defines the product initial parts. Each key is a part's name built with color and material information. Example: `var parts = { "sole": { "material": "nappa", "color": "white" }, ... }` |
| `sensitivity` | *string* | Defines the degree of sensitivity of the dragging interaction. 40 by default. |
| `size` | *number* | Initial size value of a frame image that is going to be composed. By default it's 1000px. |
| `url` | *string* | The base `url` of the server where the product is configured |
| `useChain` | *boolean* | Determines if a chain based loading should be used for the pre-loading process of the various image resources to be loaded. False by default. |
| `variant` | *string* | Variant of the customizable product |

## License

RIPE SDK is currently licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/).

## Build Automation

[![Build Status](https://travis-ci.org/ripe-tech/ripe-sdk.svg?branch=master)](https://travis-ci.org/ripe-tech/ripe-sdk)
[![npm Status](https://img.shields.io/npm/v/ripe-sdk.svg)](https://www.npmjs.com/package/ripe-sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://www.apache.org/licenses/)
