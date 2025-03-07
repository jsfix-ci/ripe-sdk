# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

*

### Changed

*

### Fixed

* Add `dku` to request options for import order
* Add `contents` to params of import order only if filled with some value

## [2.31.2] - 2022-06-08

### Added

* Add param `tenant_id` to `updateTagOrder` method - [ripe-robin-revamp/#363](https://github.com/ripe-tech/ripe-robin-revamp/issues/363)

## [2.31.1] - 2022-06-07

### Fixed

* Fix initialsSpec profile spread fallback value in image

## [2.31.0] - 2022-06-01

### Added

* Added `deleteTagOrder` methods - [ripe-robin-revamp/#363](https://github.com/ripe-tech/ripe-robin-revamp/issues/363)
* Added `deactivateTagOrder` methods - [ripe-robin-revamp/#363](https://github.com/ripe-tech/ripe-robin-revamp/issues/363)

### Changed

* Removed node 10 and 11 from github workflows

### Fixed

* Fix eslint dependencies problems

## [2.30.0] - 2022-05-20

### Added

* Add `fromArrayBuffer` and `fromBlob` to `FileTuple` - [hermes-proxy/135](https://github.com/ripe-tech/hermes-proxy/issues/135)
* Added `safe` param to be passed in `importOrder` - [ripe-util-vue/#259](https://github.com/ripe-tech/ripe-util-vue/issues/259)
* Support profile overriding in image - [ripe-white/#978](https://github.com/ripe-tech/ripe-white/issues/978)

## [2.29.0] - 2022-04-28

### Added

* Added `activateTagOrderP` and `updateTagOrderP` methods to set the tag of an order and activate it

## [2.28.0] - 2022-04-18

### Added

* Added new compose `composeOptions` to allow passing composition options such as dpi and quality.

## [2.26.0] - 2022-04-11

### Added

* Added method `resolveJustification` to find the matching justification given context and code or full code - [ripe-pulse/#317](https://github.com/ripe-tech/ripe-pulse/issues/317)
* Added `composeLogic` option to specify if the (initials builder) logic should run on server-side.  
* Added `noAwaitLayout` option so that current updates don't wait for the previous ones to be complete.

## [2.25.1] - 2022-03-31

### Fixed

* Support no `faces` in a dimension from spec in ´getDimension`
* Fix `_getOrderReportURL`, `_getOrderReportPDFURL`, `_getOrderReportPNGURL` logic and tests - [#381](https://github.com/ripe-tech/ripe-sdk/pull/381)

## [2.25.0] - 2022-03-24

### Added

* Add methods `getVideoP` and `getVideoThumbnailP` that return the video and video thumbnail for a given model and its customization - [ripe-white/#996](https://github.com/ripe-tech/ripe-white/issues/996)
* Add methods `_getVideoURL` and `_getVideoThumbnailURL` that return the URL of a video and video thumbnail, respectively, for a given model and its customization - [ripe-white/#996](https://github.com/ripe-tech/ripe-white/issues/996)
* General order chat methods - [ripe-core/#4702](https://github.com/ripe-tech/ripe-core/issues/4702)
* Support for external image URL providers and frame validators for image - [ripe-white/#996](https://github.com/ripe-tech/ripe-white/issues/996)
* Validator function `hasVideo` that verifies if a video exists in the build spec - [ripe-white/#996](https://github.com/ripe-tech/ripe-white/issues/996)
* New image bind method `bindVideoThumbnail` specific for binding to an image tag the video thumbnail image - [ripe-white/#996](https://github.com/ripe-tech/ripe-white/issues/996)
* Add method `_getOrderImageURL` - [#380](https://github.com/ripe-tech/ripe-sdk/issues/380)

### Changed

* Always loading default bundle locales for scales and sizes

## [2.24.0] - 2022-03-14

### Added

* Added methods `getSkusCsvP` and `getSkusCsv` that return a CSV document containing SKUs - [ripe-white/#979](https://github.com/ripe-tech/ripe-white/issues/979)
* Added methods `countSkusP` and `countSkus` that returns the number of SKUs - [ripe-white/#979](https://github.com/ripe-tech/ripe-white/issues/979)

### Changed

* Improve update cancellation strategy by adding a `cancel` event to cancel ongoing update promises - [#363](https://github.com/ripe-tech/ripe-sdk/pull/363)

### Fixed

* Payload `brand` field for `importBulkOrder` optional - [ripe-pulse/#281](https://github.com/ripe-tech/ripe-pulse/issues/281)

## [2.23.0] - 2022-03-07

### Added

* Added methods for waybill deletion (void) - [ripe-util-vue/#301](https://github.com/ripe-tech/ripe-util-vue/issues/301)
* Methods to unset order tracking info - [ripe-pulse/#301](https://github.com/ripe-tech/ripe-core/issues/301)

## [2.22.0] - 2022-03-03

### Added

* Added support for `invoicingInfo` field in `importOrder` - [ripe-util-vue/#247](https://github.com/ripe-tech/ripe-util-vue/issues/247)
* Added configurator configuration variable `useDefaultSize` that forces the configurator to use images with the default dimensions of the current face

### Fixed

* Use pixelRatio in configurator applied to the image but do not allow getting images bigger than the default dimensions for the current face

## [2.21.0] - 2022-02-28

### Added

* Add create order bulk methods - [ripe-pulse/#281](https://github.com/ripe-tech/ripe-pulse/issues/281)

### Changed

* Make `brand` for `importBulkOrder` optional - [ripe-pulse/#281](https://github.com/ripe-tech/ripe-pulse/issues/281)

## [2.20.0] - 2022-02-02

### Added

* Add `resolveInvoiceRuleP` and `resolveInvoiceRule` methods that return an invoice rule for the given brand, model and country - [ripe-pulse/#291](https://github.com/ripe-tech/ripe-pulse/issues/291)
* Added `getShipments/getShipmentsP` and `createShipment/createShipmentsP` - [ripe-pulse/#276](https://github.com/ripe-tech/ripe-pulse/issues/276)

## [2.19.0] - 2022-02-02

### Added

* Support for trigger of `message` event after `initialsBuilder()` call

## [2.18.0] - 2022-01-27

### Added

* `setPickupNumber` and `setPickupNumberP` in the Order API - [#33](https://github.com/ripe-tech/peri-shipping/issues/33)

## [2.17.0] - 2022-01-27

### Fixed

* Fixed method name for `signinPidP`

## [2.16.0] - 2022-01-24

### Added

* Add `lineBreakP` and `lineBreak` methods to get the lines of text after line breaking logic is applied - [3db/#195](https://github.com/ripe-tech/3db/issues/195)

### Fixed

* Remove default width and height for configurator-prc

## [2.15.1] - 2022-01-17

### Fixed

* Fixed non integer aspect ratio in image

## [2.15.0] - 2022-01-12

### Added

* Use pixel ratio in image - [ripe-white/#948](https://github.com/ripe-tech/ripe-white/issues/948)

## [2.14.0] - 2022-01-12

### Added

* Method `getDimension` that returns the size of a specific dimension and face - [ripe-white/#948](https://github.com/ripe-tech/ripe-white/issues/948)

### Changed

* Image resize now support width and height - [ripe-white/#943](https://github.com/ripe-tech/ripe-white/issues/943)

## [2.13.0] - 2022-01-07

### Added

* Add missing params to `_getImageOptions`
* Support for images not 1:1 in configurator, where the resize operation take into account the width and height instead of size - [ripe-white/#943](https://github.com/ripe-tech/ripe-white/issues/943)

## [2.12.0] - 2021-12-05

### Added

* Add `localeToNative`, `localeToNativeP`, `localeToNativeB` and `localeToNativeBP` methods to convert locale sizes to native sizes and unit tests - [#4638](https://github.com/ripe-tech/ripe-core/issues/4638)
* Add `Invoice Rules` API methods - [peri-invoicing/#3](https://github.com/ripe-tech/peri-invoicing/issues/3)
* Add `textLengthP` and `textLength` to get the length of the value of the initials

### Changed

* Made the `initialsBuilder` function `async` to support async calls in external initials builder logic
* Added `ctx` to `initialsBuilder` call so that there is parity between the Javascript and Python initials builders

## [2.11.0] - 2021-12-03

### Added

* Add `Bulk Order` API methods - [ripe-util-vue/#218](https://github.com/ripe-tech/ripe-util-vue/issues/218)
* Add initials builder ctx message dispatcher for build's js logic

## [2.10.0] - 2021-11-19

### Added

* Add `setProofOfDeliveryP` and `setProofOfDelivery` methods to set proof of delivery info of an order - [#34](https://github.com/ripe-tech/peri-shipping/issues/34)
* Add `createReturnWaybillOrder` as part of the Order API

## [2.9.0] - 2021-11-12

### Added

* Support for `size` parameter in `_getMaskURL` request
* Add `refreshShippingOrder` and `refreshShippingOrderP` - [#260](https://github.com/ripe-tech/ripe-pulse/issues/260)
* Add `blockOrderP` and `blockOrder` methods to block an order - [#263](https://github.com/ripe-tech/ripe-pulse/issues/263)

## [2.8.0] - 2021-11-05

### Added

* Support for the `Order` touch API endpoint
* Support for `scale` in import order
* Add test `should be able to set the price` in `#importOrder()` tests

### Fixed

* Fix `price` not being correctly set in `importOrderP()`
* Problem relates with invalid `hasTag()`

## [2.7.1] - 2021-09-27

### Fixed

* `useMasks` calculation on init and usage in order to allow usage of an `undefined` value that defaults to `true`

## [2.7.0] - 2021-09-13

### Added

* Added `itertools.js` to gulpfile build files in order to be bundled
* Support for `no_masks` tag
* `getPrices` which consumes `/api/config/prices` for getting prices for several configs in a single batch call

## [2.6.0] - 2021-08-27

### Added

* `notify` option to endpoints for changing an order's status, to allow triggering notifications upon a status change

## [2.5.1] - 2021-08-26

### Fixed

* Small `terminate()` issue
* Attribute stability for the canceled preload images

## [2.5.0] - 2021-08-25

### Added

* Added `itertools.js` to gulpfile build files in order to be bundled

### Changed

* Improved performance by allowing cancelling image loading for images that are not needed (quick `setFrame` changes)
* Created structures that prevented concurrent `update()` at a `Visual` class level

### Fixed

* Issue where the `changeFrame` operation was being incorrectly canceled

## [2.4.2] - 2021-08-14

### Fixed

* Removed warnings for node.js `requireSafe()` hack under webpack

## [2.4.1] - 2021-08-09

### Fixed

* Issue related to problem in loading front mask image

## [2.4.0] - 2021-08-05

### Added

* Endpoints for creating order notes

## [2.3.1] - 2021-07-26

### Changed

* Made `requireSafe()` sa safer method allowing auto catching of import errors.

## [2.3.0] - 2021-07-26

### Changed

* When doing a configurator resize use the defined `size` option, if defined, otherwise fallsback to the old behavior of using the "binded" element's width

## [2.2.3] - 2021-07-26

### Fixed

* Use of the SDK in a react-native environment

## [2.2.2] - 2021-07-26

### Added

* Support for multiple character escaping in `escape()`
* Add method to retrieve the URL for an attachment
* Support for retry in API requests when receiving authentication related errors (eg: 403)
* Add size argument to `resolveInvoiceRule` - [ripe-core/#4703](https://github.com/ripe-tech/ripe-core/issues/4703)
* Add missing `resolveTransportRule` and `resolveTransportRuleP` methods - [ripe-core/#4703](https://github.com/ripe-tech/ripe-core/issues/4703)

## [2.2.1] - 2021-06-13

### Fixed

* Addition of attachments to a specific order state (`stateCreateAttachmentOrder`) - [#230](https://github.com/ripe-tech/ripe-pulse/issues/230)

## [2.2.0] - 2021-07-06

### Added

* Ability to override `name` and `meta` for attachments - [#282](https://github.com/ripe-tech/ripe-sdk/issues/282)
* Added method to issue a create waybill command for a given order - [ripe-pulse/211](https://github.com/ripe-tech/ripe-pulse/issues/211)
* Add `rejectOrderP` and `rejectOrder` methods - [ripe-pulse/#219](https://github.com/ripe-tech/ripe-pulse/issues/219)
* Passing `locale` and `country` arguments in `ctx` when doing initials builder to allow localized sanitization of initials - [build-static/#2075](https://github.com/ripe-tech/builds-static/issues/2075)

### Fixed

* Set order status takes relevant params from options and populates request params
* Multipart encoding extended to classes that implement `toString`
* Multipart encoding no longer sends an extra newline separator on the last field

## [2.1.0] - 2021-06-22

### Changed

* Import order method propagates shipping info
* Made image support the best file format by default

### Fixed

* Initials builder initialization when `useInitialsBuilderLogic` was `false`

## [2.0.1] - 2021-06-22

### Fixed

* Small issue fix

## [2.0.0] - 2021-06-01

### Added

* [BREAKING CHANGES] Support for dynamic `initialsBuilder` logic sourced from server side 3DB ⚠️ (requires `initialsBuilder` signature change)

## [1.26.0] - 2021-06-01

### Added

* `setTracking` method to the `Order` entity
* `setReturnTracking` method to the `Order` entity
* `setMeta` method allowing dynamic set of metadata attributes for the `Order` entity
* Method for generating an image URL from a query (`_queryToImageUrl`)

## [1.25.9] - 2021-05-24

### Added

* Transport Rule API
* `getTransportOrder` method
* `attachmentOrder` method
* `qualityAssureOrder` method

## [1.25.8] - 2021-05-14

### Added

* `getDefaultsP` - the promise based version of `getDefaults`
* `changePriority` Order API method
* `tenancyAccountMe` endpoint

### Fixed

* `lowlight` when the mouse leaves the configurator area

## [1.25.7] - 2021-04-29

### Fixed

* Take `variant` into account in update operations

## [1.25.6] - 2021-04-01

### Added

* Small changes in the code

## [1.25.5] - 2021-04-01

### Added

* Added typing for `getBuildsP`

## [1.25.4] - 2021-03-23

### Added

* Added typing for `getBuildP`

### Changed

* Fixed jsdoc by removing unused parameter

## [1.25.3] - 2021-03-03

### Added

* Added typing for native to size

## [1.25.2] - 2021-02-23

### Added

* Support for validation of SKU in API calls
* More locale utility methods

## [1.25.1] - 2021-02-22

### Changed

* Support for `count` methods added to the API level

## [1.25.0] - 2021-02-20

### Changed

* Added extra param ´override´ to `setInitials` and `setInitialsExtra`
