/**
 * MapScreenr.js
 *
 * A simple container for Map attributes given by switching to an Area within
 * that map. A bounding box of the current viewport is kept, along with any
 * other information desired.
 *
 * MapScreenr is the closest thing GameStartr projects have to a "global"
 * variable depository, where miscellaneous variables may be stored.
 *
 * @example
 * // Creating and using a MapScreenr to emulate a simple screen.
 * var MapScreener = new MapScreenr({
 *     "width": 640,
 *     "height": 480
 * });
 * MapScreener.clearScreen();
 *
 * // [0, 640, 480, 0]
 * console.log([
 *     MapScreener.top, MapScreener.right, MapScreener.bottom, MapScreener.left
 * ]);
 *
 * @example
 * // Creating and using a MapScreenr to store screen information.
 * var MapScreener = new MapScreenr({
 *     "width": 640,
 *     "height": 480,
 *     "variables": {
 *         "pixels": function () {
 *             return this.width * this.height;
 *         },
 *         "resolution": function () {
 *             return this.width / this.height;
 *         }
 *     }
 * });
 * MapScreener.clearScreen();
 *
 * // 307200 "pixels at" 1.3333333333333333
 * console.log(MapScreener.pixels, "pixels at", MapScreener.resolution);
 *
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var MapScreenr = (function () {
    /**
     * Resets the MapScreenr. All members of the settings argument are copied
     * to the MapScreenr itself, though only width and height are required.
     */
    function MapScreenr(settings) {
        var name;
        if (typeof settings.width === "undefined") {
            throw new Error("No width given to MapScreenr.");
        }
        if (typeof settings.height === "undefined") {
            throw new Error("No height given to MapScreenr.");
        }
        for (name in settings) {
            if (settings.hasOwnProperty(name)) {
                this[name] = settings[name];
            }
        }
        this.variables = settings.variables || {};
        this.variableArgs = settings.variableArgs || [];
    }
    /* State changes
    */
    /**
     * Completely clears the MapScreenr for use in a new Area. Positioning is
     * reset to (0,0) and user-configured variables are recalculated.
     */
    MapScreenr.prototype.clearScreen = function () {
        this.left = 0;
        this.top = 0;
        this.right = this.width;
        this.bottom = this.height;
        this.setMiddleX();
        this.setMiddleY();
        this.setVariables();
    };
    /**
     * Computes middleX as the midpoint between left and right.
     */
    MapScreenr.prototype.setMiddleX = function () {
        this.middleX = (this.left + this.right) / 2;
    };
    /**
     * Computes middleY as the midpoint between top and bottom.
     */
    MapScreenr.prototype.setMiddleY = function () {
        this.middleY = (this.top + this.bottom) / 2;
    };
    /**
     * Runs all variable Functions with variableArgs to recalculate their
     * values.
     */
    MapScreenr.prototype.setVariables = function () {
        for (var i in this.variables) {
            if (this.variables.hasOwnProperty(i)) {
                this[i] = this.variables[i].apply(this, this.variableArgs);
            }
        }
    };
    /* Element shifting
    */
    /**
     * Shifts the MapScreenr horizontally and vertically via shiftX and shiftY.
     *
     * @param {Number} dx
     * @param {Number} dy
     */
    MapScreenr.prototype.shift = function (dx, dy) {
        if (dx) {
            this.shiftX(dx);
        }
        if (dy) {
            this.shiftY(dy);
        }
    };
    /**
     * Shifts the MapScreenr horizontally by changing left and right by the dx.
     *
     * @param {Number} dx
     */
    MapScreenr.prototype.shiftX = function (dx) {
        this.left += dx;
        this.right += dx;
    };
    /**
     * Shifts the MapScreenr vertically by changing top and bottom by the dy.
     *
     * @param {Number} dy
     */
    MapScreenr.prototype.shiftY = function (dy) {
        this.top += dy;
        this.bottom += dy;
    };
    return MapScreenr;
})();
/**
 * ChangeLinr.js
 * A general utility for transforming raw input to processed output. This is
 * done by keeping an Array of transform Functions to process input on.
 * Outcomes for inputs are cached so repeat runs are O(1).
 * @example
 * // Creating and using a ChangeLinr to square numbers.
 * var ChangeLiner = new ChangeLinr({
 *     "transforms": {
 *          "square": function (number) {
 *              return number * number;
 *          }
 *      },
 *     "pipeline": ["square"]
 * });
 * console.log(ChangeLiner.process(7), "Test"); // 49
 * console.log(ChangeLiner.getCached("Test")); // 49
 * @example
 * // Creating and using a ChangeLinr to calculate Fibonacci numbers.
 * var ChangeLiner = new ChangeLinr({
 *     "transforms": {
 *         "fibonacci": function (number, key, attributes, ChangeLiner) {
 *             if (!number) {
 *                 return 0;
 *             } else if (number === 1) {
 *                 return 1;
 *             }
 *             return ChangeLiner.process(number - 1) + ChangeLiner.process(number - 2);
 *         }
 *     },
 *     "pipeline": ["fibonacci"]
 * });
 * console.log(ChangeLiner.process(7)); // 13
 * console.log(ChangeLiner.getCache()); // {0: 0, 1: 1, ... 6: 8, 7: 13}
 * @example
 * // Creating and using a ChangeLinr to lowercase a string, remove whitespace,
 * // and sum the character codes of the result.
 * var ChangeLiner = new ChangeLinr({
 *     "transforms": {
 *         "toLowerCase": function (string) {
 *             return string.toLowerCase();
 *         },
 *         "removeWhitespace": function (string) {
 *             return string.replace(/\s/g, '');
 *         },
 *         "sum": function (string) {
 *             var total = 0,
 *                 i;
 *             for (i = 0; i < string.length; i += 1) {
 *                 total += string.charCodeAt(i);
 *             }
 *             return total;
 *         }
 *     },
 *     "pipeline": ["toLowerCase", "removeWhitespace", "sum"]
 * });
 * console.log(ChangeLiner.process("Hello world!", "Test")); // 1117
 * console.log(ChangeLiner.getCached("Test")); // 1117
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var ChangeLinr = (function () {
    /**
     * Resets the ChangeLinr.
     * @constructor
     * @param {String[]} pipeline   The ordered pipeline of String names of the
     *                              transforms to call.
     * @param {Object} [transforms]   An Object containing Functions keyed by
     *                                their String name.
     * @param {Boolean} [doMakeCache]   Whether a cache should be constructed
     *                                  from inputs (defaults to true).
     * @param {Boolean} [doUseCache]   Whether the cache should be used to
     *                                 cache outputs (defaults to true).
     * @param {Boolean} [doUseGlobals]   Whether global Functions may be
     *                                   referenced by the pipeline Strings,
     *                                   rather than just ones in transforms
     *                                   (defaults to false).
     */
    function ChangeLinr(settings) {
        var i;
        if (typeof settings.pipeline === "undefined") {
            throw new Error("No pipeline given to ChangeLinr.");
        }
        this.pipeline = settings.pipeline || [];
        if (typeof settings.transforms === "undefined") {
            throw new Error("No transforms given to ChangeLinr.");
        }
        this.transforms = settings.transforms || {};
        this.doMakeCache = typeof settings.doMakeCache === "undefined" ? true : settings.doMakeCache;
        this.doUseCache = typeof settings.doUseCache === "undefined" ? true : settings.doUseCache;
        this.cache = {};
        this.cacheFull = {};
        for (i = 0; i < this.pipeline.length; ++i) {
            // Don't allow null/false transforms
            if (!this.pipeline[i]) {
                throw new Error("Pipe[" + i + "] is invalid.");
            }
            // Make sure each part of the pipeline exists
            if (!this.transforms.hasOwnProperty(this.pipeline[i])) {
                if (!this.transforms.hasOwnProperty(this.pipeline[i])) {
                    throw new Error("Pipe[" + i + "] (\"" + this.pipeline[i] + "\") " + "not found in transforms.");
                }
            }
            // Also make sure each part of the pipeline is a Function
            if (!(this.transforms[this.pipeline[i]] instanceof Function)) {
                throw new Error("Pipe[" + i + "] (\"" + this.pipeline[i] + "\") " + "is not a valid Function from transforms.");
            }
            this.cacheFull[i] = this.cacheFull[this.pipeline[i]] = {};
        }
    }
    /* Simple gets
    */
    /**
     * @return {Object} The cached output of self.process and self.processFull.
     */
    ChangeLinr.prototype.getCache = function () {
        return this.cache;
    };
    /**
     * @param {String} key   The key under which the output was processed
     * @return {Mixed} The cached output filed under the given key.
     */
    ChangeLinr.prototype.getCached = function (key) {
        return this.cache[key];
    };
    /**
     * @return {Object} A complete listing of the cached outputs from all
     *                  processed information, from each pipeline transform.
     */
    ChangeLinr.prototype.getCacheFull = function () {
        return this.cacheFull;
    };
    /**
     * @return {Boolean} Whether the cache object is being kept.
     */
    ChangeLinr.prototype.getDoMakeCache = function () {
        return this.doMakeCache;
    };
    /**
     * @return {Boolean} Whether previously cached output is being used in new
     *                   process requests.
     */
    ChangeLinr.prototype.getDoUseCache = function () {
        return this.doUseCache;
    };
    /* Core processing
    */
    /**
     * Applies a series of transforms to input data. If doMakeCache is on, the
     * outputs of this are stored in cache and cacheFull.
     *
     * @param {Mixed} data   The data to be transformed.
     * @param {String} [key]   They key under which the data is to be stored.
     *                         If needed but not provided, defaults to data.
     * @param {Object} [attributes]   Any extra attributes to be given to the
     *                                transform Functions.
     * @return {Mixed} The final output of the pipeline.
     */
    ChangeLinr.prototype.process = function (data, key, attributes) {
        if (key === void 0) { key = undefined; }
        if (attributes === void 0) { attributes = undefined; }
        var i;
        if (typeof key === "undefined" && (this.doMakeCache || this.doUseCache)) {
            key = data;
        }
        // If this keyed input was already processed, get that
        if (this.doUseCache && this.cache.hasOwnProperty(key)) {
            return this.cache[key];
        }
        for (i = 0; i < this.pipeline.length; ++i) {
            data = this.transforms[this.pipeline[i]](data, key, attributes, self);
            if (this.doMakeCache) {
                this.cacheFull[this.pipeline[i]][key] = data;
            }
        }
        if (this.doMakeCache) {
            this.cache[key] = data;
        }
        return data;
    };
    /**
     * A version of self.process that returns the complete output from each
     * pipelined transform Function in an Object.
     *
     * @param {Mixed} data   The data to be transformed.
     * @param {String} [key]   They key under which the data is to be stored.
     *                         If needed but not provided, defaults to data.
     * @param {Object} [attributes]   Any extra attributes to be given to the
     *                                transform Functions.
     * @return {Object} The complete output of the transforms.
     */
    ChangeLinr.prototype.processFull = function (raw, key, attributes) {
        var output = {}, i;
        this.process(raw, key, attributes);
        for (i = 0; i < this.pipeline.length; ++i) {
            output[i] = output[this.pipeline[i]] = this.cacheFull[this.pipeline[i]][key];
        }
        return output;
    };
    return ChangeLinr;
})();
/**
 * A general utility for retrieving data from an Object based on nested class
 * names. You can think of the internal "library" Object as a tree structure,
 * such that you can pass in a listing (in any order) of the path to data for
 * retrieval.
 *
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var StringFilr = (function () {
    /**
     * Resets the StringFilr.
     *
     * @constructor
     * @param {IStringFilrSettings} settings
     */
    function StringFilr(settings) {
        if (!settings) {
            throw new Error("No settings given to StringFilr.");
        }
        if (!settings.library) {
            throw new Error("No library given to StringFilr.");
        }
        this.library = settings.library;
        this.normal = settings.normal;
        this.requireNormalKey = settings.requireNormalKey;
        this.cache = {};
        if (this.requireNormalKey) {
            if (typeof this.normal === "undefined") {
                throw new Error("StringFilr is given requireNormalKey, but no normal class.");
            }
            this.ensureLibraryNormal();
        }
    }
    /**
     * @return {Object} The base library of stored information.
     */
    StringFilr.prototype.getLibrary = function () {
        return this.library;
    };
    /**
     * @return {String} The optional normal class String.
     */
    StringFilr.prototype.getNormal = function () {
        return this.normal;
    };
    /**
     * @return {Object} The complete cache of cached output.
     */
    StringFilr.prototype.getCache = function () {
        return this.cache;
    };
    /**
     * @return {Mixed} A cached value, if it exists/
     */
    StringFilr.prototype.getCached = function (key) {
        return this.cache[key];
    };
    /**
     * Completely clears the cache Object.
     */
    StringFilr.prototype.clearCache = function () {
        this.cache = {};
    };
    /**
     * Clears the cached entry for a key.
     *
     * @param {String} key
     */
    StringFilr.prototype.clearCached = function (key) {
        if (this.normal) {
            key = key.replace(this.normal, "");
        }
        delete this.cache[key];
    };
    /**
     * Retrieves the deepest matching data in the library for a key.
     *
     * @param {String} keyRaw
     * @return {Mixed}
     */
    StringFilr.prototype.get = function (keyRaw) {
        var key, result;
        if (this.normal) {
            key = keyRaw.replace(this.normal, "");
        }
        else {
            key = keyRaw;
        }
        // Quickly return a cached result if it exists
        if (this.cache.hasOwnProperty(key)) {
            return this.cache[key];
        }
        // Since no existed, it must be found deep within the library
        result = this.followClass(key.split(/\s+/g), this.library);
        this.cache[key] = this.cache[keyRaw] = result;
        return result;
    };
    /**
     * Utility helper to recursively check for tree branches in the library
     * that don't have a key equal to the normal. For each sub-directory that
     * is caught, the path to it is added to output.
     *
     * @param {Object} current   The current location being searched within
     *                           the library.
     * @param {String} path   The current path within the library.
     * @param {String[]} output   An Array of the String paths to parts that
     *                           don't have a matching key.
     * @return {String[]} output
     */
    StringFilr.prototype.findLackingNormal = function (current, path, output) {
        var i;
        if (!current.hasOwnProperty(this.normal)) {
            output.push(path);
        }
        if (typeof current[i] === "object") {
            for (i in current) {
                if (current.hasOwnProperty(i)) {
                    this.findLackingNormal(current[i], path + " " + i, output);
                }
            }
        }
        return output;
    };
    /**
     * Utility function to follow a path into the library (this is the driver
     * for searching into the library). For each available key, if it matches
     * a key in current, it is removed from keys and recursion happens on the
     * sub-directory in current.
     *
     * @param {String[]} keys   The currently available keys to search within.
     * @param {Object} current   The current location being searched within
     *                           the library.
     * @return {Mixed} The most deeply matched part of the library.
     */
    StringFilr.prototype.followClass = function (keys, current) {
        var key, i;
        // If keys runs out, we're done
        if (!keys || !keys.length) {
            return current;
        }
        for (i = 0; i < keys.length; i += 1) {
            key = keys[i];
            // ...if it matches, recurse on the other keys
            if (current.hasOwnProperty(key)) {
                keys.splice(i, 1);
                return this.followClass(keys, current[key]);
            }
        }
        // If no key matched, try the normal (default)
        if (this.normal && current.hasOwnProperty(this.normal)) {
            return this.followClass(keys, current[this.normal]);
        }
        // Nothing matches anything; we're done.
        return current;
    };
    StringFilr.prototype.ensureLibraryNormal = function () {
        var caught = this.findLackingNormal(this.library, "base", []);
        if (caught.length) {
            throw new Error("Found " + caught.length + " library " + "sub-directories missing the normal: " + "\r\n  " + caught.join("\r\n  "));
        }
    };
    return StringFilr;
})();
/// <reference path="ChangeLinr/ChangeLinr.ts" />
/// <reference path="StringFilr/StringFilr.ts" />
/// <reference path="Uint8ClampedArray.d.ts" />
/**
 * PixelRendr.js
 *
 * A moderately unusual graphics module designed to compress images as
 * compressed text blobs and store the text blobs in a StringFilr. These tasks
 * are performed and cached quickly enough for use in real-time environments,
 * such as real-time video games.
 *
 * @todo
 * The first versions of this library were made many years ago by an
 * inexperienced author, and have undergone only moderate structural revisions
 * since. There are two key improvements that should happen by the end of 2015:
 * 1. On reset, the source library should be mapped to a PartialRender class
 *    that stores loading status and required ("post") references, to enable
 *    lazy loading. See #71.
 * 2. Once lazy loading is implemented for significantly shorter startup times,
 *    an extra layer of compression should be added to compress the technically
 *    human-readable String sources to a binary-ish format. See #236.
 * 3. Rewrite the heck out of this piece of crap.
 *
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var PixelRendr = (function () {
    /**
     * Resets the PixelRendr.
     *
     * @constructor
     * @param {IPixelRendrSettings} settings
     */
    function PixelRendr(settings) {
        if (!settings) {
            throw new Error("No settings given to PixelRendr.");
        }
        if (!settings.paletteDefault) {
            throw new Error("No paletteDefault given to PixelRendr.");
        }
        this.paletteDefault = settings.paletteDefault;
        this.digitsizeDefault = this.getDigitSize(this.paletteDefault);
        this.digitsplit = new RegExp(".{1," + this.digitsizeDefault + "}", "g");
        this.library = {
            "raws": settings.library || {},
            "posts": []
        };
        this.filters = settings.filters || {};
        this.scale = settings.scale || 1;
        this.flipVert = settings.flipVert || "flip-vert";
        this.flipHoriz = settings.flipHoriz || "flip-horiz";
        this.spriteWidth = settings.spriteWidth || "spriteWidth";
        this.spriteHeight = settings.spriteHeight || "spriteHeight";
        // The first ChangeLinr does the raw processing of Strings to sprites
        // This is used to load & parse sprites into memory on startup
        this.ProcessorBase = new ChangeLinr({
            "transforms": {
                "spriteUnravel": this.spriteUnravel.bind(this),
                "spriteApplyFilter": this.spriteApplyFilter.bind(this),
                "spriteExpand": this.spriteExpand.bind(this),
                "spriteGetArray": this.spriteGetArray.bind(this)
            },
            "pipeline": [
                "spriteUnravel",
                "spriteApplyFilter",
                "spriteExpand",
                "spriteGetArray"
            ]
        });
        // The second ChangeLinr does row repeating and flipping
        // This is done on demand when given a sprite's settings Object
        this.ProcessorDims = new ChangeLinr({
            "transforms": {
                "spriteRepeatRows": this.spriteRepeatRows.bind(this),
                "spriteFlipDimensions": this.spriteFlipDimensions.bind(this)
            },
            "pipeline": [
                "spriteRepeatRows",
                "spriteFlipDimensions"
            ]
        });
        // As a utility, a processor is included to encode image data to sprites
        this.ProcessorEncode = new ChangeLinr({
            "transforms": {
                "imageGetData": this.imageGetData.bind(this),
                "imageGetPixels": this.imageGetPixels.bind(this),
                "imageMapPalette": this.imageMapPalette.bind(this),
                "imageCombinePixels": this.imageCombinePixels.bind(this)
            },
            "pipeline": [
                "imageGetData",
                "imageGetPixels",
                "imageMapPalette",
                "imageCombinePixels"
            ],
            "doUseCache": false
        });
        this.library.sprites = this.libraryParse(this.library.raws, "");
        // Post commands are evaluated after the first processing run
        this.libraryPosts();
        // The BaseFiler provides a searchable 'view' on the library of sprites
        this.BaseFiler = new StringFilr({
            "library": this.library.sprites,
            "normal": "normal" // to do: put this somewhere more official?
        });
    }
    /* Simple gets
    */
    /**
     * @return {Object} The base container for storing sprite information.
     */
    PixelRendr.prototype.getBaseLibrary = function () {
        return this.BaseFiler.getLibrary();
    };
    /**
     * @return {StringFilr} The StringFilr interface on top of the base library.
     */
    PixelRendr.prototype.getBaseFiler = function () {
        return this.BaseFiler;
    };
    /**
     * @return {ChangeLinr} The processor that turns raw strings into partial
     * sprites.
     */
    PixelRendr.prototype.getProcessorBase = function () {
        return this.ProcessorBase;
    };
    /**
     * @return {ChangeLinr} The processor that turns partial sprites and repeats
     *                      rows.
     */
    PixelRendr.prototype.getProcessorDims = function () {
        return this.ProcessorDims;
    };
    /**
     * @return {ChangeLinr} The processor that takes real images and compresses
     *                      their data into sprite Strings.
     */
    PixelRendr.prototype.getProcessorEncode = function () {
        return this.ProcessorEncode;
    };
    /**
     * @param {String} key
     * @return {Mixed} Returns the base sprite for a key. This will either be a
     *                 Uint8ClampedArray if a sprite is found, or the deepest
     *                 Object in the library.
     */
    PixelRendr.prototype.getSpriteBase = function (key) {
        return this.BaseFiler.get(key);
    };
    /* External APIs
    */
    /**
     * Standard render function. Given a key, this finds the raw information via
     * BaseFiler and processes it using ProcessorDims. Attributes are needed so
     * the ProcessorDims can stretch it on width and height.
     *
     * @param {String} key   The general key for the sprite to be passed
     *                       directly to BaseFiler.get.
     * @param {Object} attributes   Additional attributes for the sprite; width
     *                              and height Numbers are required.
     * @return {Uint8ClampedArray}
     */
    PixelRendr.prototype.decode = function (key, attributes) {
        // BaseFiler stores the cache of the base sprites. Note that it doesn't
        // actually require the extra attributes
        var sprite = this.BaseFiler.get(key);
        if (!sprite) {
            throw new Error("No raw sprite found for " + key + ".");
        }
        // Multiple sprites have their sizings taken from attributes
        if (sprite.multiple) {
            if (!sprite.processed) {
                this.processSpriteMultiple(sprite, key, attributes);
            }
        }
        else {
            // Single (actual) sprites process for size (row) scaling, and flipping
            if (!(sprite instanceof Uint8ClampedArray)) {
                throw new Error("No single raw sprite found for: '" + key + "'");
            }
            sprite = this.ProcessorDims.process(sprite, key, attributes);
        }
        return sprite;
    };
    /**
     * Encodes an image into a sprite via ProcessorEncode.process.
     *
     * @param {HTMLImageElement} image
     * @param {Function} [callback]   An optional callback to call on the image
     *                                with source as an extra argument.
     * @param {Mixed} [source]   An optional extra argument for callback,
     *                           commonly provided by this.encodeUri as the
     *                           image source.
     */
    PixelRendr.prototype.encode = function (image, callback, source) {
        var result = this.ProcessorEncode.process(image);
        if (callback) {
            callback(result, image, source);
        }
        return result;
    };
    /**
     * Fetches an image from a source and encodes it into a sprite via
     * ProcessEncode.process. An HtmlImageElement is created and given an onload
     * of this.encode.
     *
     * @param {String} uri
     * @param {Function} callback   A callback for when this.encode finishes to
     *                              call on the results.
     */
    PixelRendr.prototype.encodeUri = function (uri, callback) {
        var image = document.createElement("img");
        image.onload = this.encode.bind(self, image, callback);
        image.src = uri;
    };
    /**
     * Miscellaneous utility to generate a complete palette from raw image pixel
     * data. Unique [r,g,b,a] values are found using tree-based caching, and
     * separated into grayscale (r,g,b equal) and general (r,g,b unequal). If a
     * pixel has a=0, it's completely transparent and goes before anything else
     * in the palette. Grayscale colors come next in order of light to dark, and
     * general colors come next sorted by decreasing r, g, and b in order.
     *
     * @param {Uint8ClampedArray} data   The equivalent data from a context's
     *                                   getImageData(...).data.
     * @param {Boolean} [forceZeroColor]   Whether the palette should have a
     *                                     [0,0,0,0] color as the first element
     *                                     even if data does not contain it (by
     *                                     default, false).
     * @param {Boolean} [giveArrays]   Whether the resulting palettes should be
     *                                 converted to Arrays (by default, false).
     * @return {Uint8ClampedArray[]} A working palette that may be used in
     *                               sprite settings (Array[] if giveArrays is
     *                               true).
     */
    PixelRendr.prototype.generatePaletteFromRawData = function (data, forceZeroColor, giveArrays) {
        if (forceZeroColor === void 0) { forceZeroColor = false; }
        if (giveArrays === void 0) { giveArrays = false; }
        var tree = {}, colorsGeneral = [], colorsGrayscale = [], output, i;
        for (i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) {
                forceZeroColor = true;
                continue;
            }
            if (tree[data[i]] && tree[data[i]][data[i + 1]] && tree[data[i]][data[i + 1]][data[i + 2]] && tree[data[i]][data[i + 1]][data[i + 2]][data[i + 3]]) {
                continue;
            }
            if (!tree[data[i]]) {
                tree[data[i]] = {};
            }
            if (!tree[data[i]][data[i + 1]]) {
                tree[data[i]][data[i + 1]] = {};
            }
            if (!tree[data[i]][data[i + 1]][data[i + 2]]) {
                tree[data[i]][data[i + 1]][data[i + 2]] = {};
            }
            if (!tree[data[i]][data[i + 1]][data[i + 2]][data[i + 3]]) {
                tree[data[i]][data[i + 1]][data[i + 2]][data[i + 3]] = true;
                if (data[i] === data[i + 1] && data[i + 1] === data[i + 2]) {
                    colorsGrayscale.push(data.subarray(i, i + 4));
                }
                else {
                    colorsGeneral.push(data.subarray(i, i + 4));
                }
            }
        }
        // It's safe to sort grayscale colors just on their first values, since
        // grayscale implies they're all the same.
        colorsGrayscale.sort(function (a, b) {
            return a[0] - b[0];
        });
        // For regular colors, sort by the first color that's not equal, so in 
        // order red, green, blue, alpha.
        colorsGeneral.sort(function (a, b) {
            for (i = 0; i < 4; i += 1) {
                if (a[i] !== b[i]) {
                    return b[i] - a[i];
                }
            }
        });
        if (forceZeroColor) {
            output = [new Uint8ClampedArray([0, 0, 0, 0])].concat(colorsGrayscale).concat(colorsGeneral);
        }
        else {
            output = colorsGrayscale.concat(colorsGeneral);
        }
        if (!giveArrays) {
            return output;
        }
        for (i = 0; i < output.length; i += 1) {
            output[i] = Array.prototype.slice.call(output[i]);
        }
        return output;
    };
    /**
     * Copies a stretch of members from one Uint8ClampedArray or number[] to
     * another. This is a useful utility Function for code that may use this
     * PixelRendr to draw its output sprites, such as PixelDrawr.
     *
     * @param {Uint8ClampedArray} source
     * @param {Uint8ClampedArray} destination
     * @param {Number} readloc   Where to start reading from in the source.
     * @param {Number} writeloc   Where to start writing to in the source.
     * @param {Number} writelength   How many members to copy over.
     * @see http://www.html5rocks.com/en/tutorials/webgl/typed_arrays/
     * @see http://www.javascripture.com/Uint8ClampedArray
     */
    PixelRendr.prototype.memcpyU8 = function (source, destination, readloc, writeloc, writelength) {
        if (readloc === void 0) { readloc = 0; }
        if (writeloc === void 0) { writeloc = 0; }
        if (writelength === void 0) { writelength = Math.max(0, Math.min(source.length, destination.length)); }
        if (!source || !destination || readloc < 0 || writeloc < 0 || writelength <= 0) {
            return;
        }
        if (readloc >= source.length || writeloc >= destination.length) {
            // console.log("Alert: memcpyU8 requested out of bounds!");
            // console.log("source, destination, readloc, writeloc, writelength");
            // console.log(arguments);
            return;
        }
        // JIT compilcation help
        var lwritelength = writelength + 0, lwriteloc = writeloc + 0, lreadloc = readloc + 0;
        while (lwritelength--) {
            destination[lwriteloc++] = source[lreadloc++];
        }
    };
    /* Library parsing
     */
    /**
     * Recursive Function to go throw a library and parse it. A copy of the
     * structure is made where each result is either a parsed sprite, a
     * placeholder for a post command, or a recursively generated child Object.
     *
     * @param {Object} reference   The raw source structure to be parsed.
     * @param {String} path   The path to the current place within the library.
     * @return {Object} The parsed library Object.
     */
    PixelRendr.prototype.libraryParse = function (reference, path) {
        var setnew = {}, objref, i;
        for (i in reference) {
            if (!reference.hasOwnProperty(i)) {
                continue;
            }
            objref = reference[i];
            switch (objref.constructor) {
                case String:
                    setnew[i] = this.ProcessorBase.process(objref, path + " " + i);
                    break;
                case Array:
                    this.library.posts.push({
                        caller: setnew,
                        name: i,
                        command: reference[i],
                        path: path + " " + i
                    });
                    break;
                default:
                    setnew[i] = this.libraryParse(objref, path + " " + i);
                    break;
            }
        }
        return setnew;
    };
    /**
     * Driver to evaluate post-processing commands, such as copies and filters.
     * This is run after the main processing finishes. Each post command is
     * given to evaluatePost.
     */
    PixelRendr.prototype.libraryPosts = function () {
        var posts = this.library.posts, post, i;
        for (i = 0; i < posts.length; i += 1) {
            post = posts[i];
            post.caller[post.name] = this.evaluatePost(post.caller, post.command, post.path);
        }
    };
    /**
     * Evaluates a post command and returns the result to be used in the
     * library. It can be "same", "filter", or "vertical".
     *
     * @param {Object} caller   The place within the library store results in.
     * @param {Array} command   The command from the library, represented as
     *                          ["type", [info...]]
     * @param {String} path   The path to the caller.
     */
    PixelRendr.prototype.evaluatePost = function (caller, command, path) {
        var spriteRaw, filter;
        switch (command[0]) {
            case "same":
                spriteRaw = this.followPath(this.library.raws, command[1], 0);
                if (spriteRaw.constructor === String) {
                    return this.ProcessorBase.process(spriteRaw, path);
                }
                else if (spriteRaw.constructor === Array) {
                    return this.evaluatePost(caller, spriteRaw, path);
                }
                return this.libraryParse(spriteRaw, path);
            case "filter":
                // Find the sprite this should be filtering from
                spriteRaw = this.followPath(this.library.raws, command[1], 0);
                filter = this.filters[command[2]];
                if (!filter) {
                    console.warn("Invalid filter provided:", command[2], this.filters);
                    filter = {};
                }
                return this.evaluatePostFilter(spriteRaw, path, filter);
            case "multiple":
                return this.evaluatePostMultiple(path, command);
            default:
                console.warn("Unknown post command: '" + command[0] + "'.", caller, command, path);
        }
    };
    /**
     * Driver function to recursively apply a filter on a sprite or Object.
     *
     * @param {Mixed} spriteRaw   What the filter is being applied on (either a
     *                            sprite, or a collection of sprites).
     * @param {String} path   The path to the spriteRaw in the library.
     * @param {Object} filter   The pre-determined filter to apply.
     */
    PixelRendr.prototype.evaluatePostFilter = function (spriteRaw, path, filter) {
        // If it's just a String, process the sprite normally
        if (spriteRaw.constructor === String) {
            return this.ProcessorBase.process(spriteRaw, path, {
                filter: filter
            });
        }
        // If it's an Array, that's a post that hasn't yet been evaluated: evaluate it by the path
        if (spriteRaw instanceof Array) {
            return this.evaluatePostFilter(this.followPath(this.library.raws, spriteRaw[1], 0), spriteRaw[1].join(" "), filter);
        }
        // If it's a generic Object, go recursively on its children
        if (spriteRaw instanceof Object) {
            var output = {}, i;
            for (i in spriteRaw) {
                if (spriteRaw.hasOwnProperty(i)) {
                    output[i] = this.evaluatePostFilter(spriteRaw[i], path + " " + i, filter);
                }
            }
            return output;
        }
        // Anything else is a complaint
        console.warn("Invalid sprite provided for a post filter.", spriteRaw, path, filter);
    };
    /**
     * Creates a SpriteMultiple based on a library's command.
     *
     * @param {String} path   The path to the SpriteMultiple.
     * @param {Array} command   The instructions from the library, in the form
     *                          ["multiple", "{direction}", {Information}].
     */
    PixelRendr.prototype.evaluatePostMultiple = function (path, command) {
        var direction = command[1], sections = command[2], output = {
            "direction": direction,
            "multiple": true,
            "sprites": {},
            "processed": false,
            "topheight": sections.topheight | 0,
            "rightwidth": sections.rightwidth | 0,
            "bottomheight": sections.bottomheight | 0,
            "leftwidth": sections.leftwidth | 0,
            "middleStretch": sections.middleStretch || false
        }, i;
        for (i in sections) {
            if (sections.hasOwnProperty(i)) {
                output.sprites[i] = this.ProcessorBase.process(sections[i], path + direction + i);
            }
        }
        return output;
    };
    /**
     * Processes each of the components in a SpriteMultiple. These are all
     * individually processed using the attributes by the dimensions processor.
     * Each sub-sprite will be processed as if it were in a sub-Object referred
     * to by the path (so if path is "foo bar", "foo bar middle" will be the
     * middle sprite's key).
     *
     * @param {SpriteMultiple} sprite
     * @param {String} key
     * @param {Object} attributes
     */
    PixelRendr.prototype.processSpriteMultiple = function (sprite, key, attributes) {
        for (var i in sprite.sprites) {
            if (sprite.sprites[i] instanceof Uint8ClampedArray) {
                sprite.sprites[i] = this.ProcessorDims.process(sprite.sprites[i], key + " " + i, attributes);
            }
        }
        sprite.processed = true;
    };
    /* Core pipeline functions
    */
    /**
     * Given a compressed raw sprite data string, this 'unravels' it. This is
     * the first Function called in the base processor. It could output the
     * Uint8ClampedArray immediately if given the area - deliberately does not
     * to simplify sprite library storage.
     *
     * @param {String} colors   The raw sprite String, including commands like
     *                          "p" and "x".
     * @return {String} A version of the sprite with no fancy commands, just
     *                  the numbers.
     */
    PixelRendr.prototype.spriteUnravel = function (colors) {
        var paletteref = this.getPaletteReferenceStarting(this.paletteDefault), digitsize = this.digitsizeDefault, clength = colors.length, current, rep, nixloc, output = "", loc = 0;
        while (loc < clength) {
            switch (colors[loc]) {
                case "x":
                    // Get the location of the ending comma
                    nixloc = colors.indexOf(",", ++loc);
                    // Get the color
                    current = this.makeDigit(paletteref[colors.slice(loc, loc += digitsize)], this.digitsizeDefault);
                    // Get the rep times
                    rep = Number(colors.slice(loc, nixloc));
                    while (rep--) {
                        output += current;
                    }
                    loc = nixloc + 1;
                    break;
                case "p":
                    // If the next character is a "[", customize.
                    if (colors[++loc] === "[") {
                        nixloc = colors.indexOf("]");
                        // Isolate and split the new palette's numbers
                        paletteref = this.getPaletteReference(colors.slice(loc + 1, nixloc).split(","));
                        loc = nixloc + 1;
                        digitsize = 1;
                    }
                    else {
                        // Otherwise go back to default
                        paletteref = this.getPaletteReference(this.paletteDefault);
                        digitsize = this.digitsizeDefault;
                    }
                    break;
                default:
                    output += this.makeDigit(paletteref[colors.slice(loc, loc += digitsize)], this.digitsizeDefault);
                    break;
            }
        }
        return output;
    };
    /**
     * Repeats each number in the given string a number of times equal to the
     * scale. This is the second Function called by the base processor.
     *
     * @param {String} colors
     * @return {String}
     */
    PixelRendr.prototype.spriteExpand = function (colors) {
        var output = "", clength = colors.length, i = 0, j, current;
        while (i < clength) {
            current = colors.slice(i, i += this.digitsizeDefault);
            for (j = 0; j < this.scale; ++j) {
                output += current;
            }
        }
        return output;
    };
    /**
     * Used during post-processing before spriteGetArray to filter colors. This
     * is the third Function used by the base processor, but it just returns the
     * original sprite if no filter should be applied from attributes.
     * Filters are applied here because the sprite is just the numbers repeated,
     * so it's easy to loop through and replace them.
     *
     * @param {String} colors
     * @param {String} key
     * @param {Object} attributes
     * @return {String}
     */
    PixelRendr.prototype.spriteApplyFilter = function (colors, key, attributes) {
        // If there isn't a filter (as is the normal), just return the sprite
        if (!attributes || !attributes.filter) {
            return colors;
        }
        var filter = attributes.filter, filterName = filter[0];
        if (!filterName) {
            return colors;
        }
        switch (filterName) {
            case "palette":
                // Split the colors on on each digit
                // ("...1234..." => [..., "12", "34", ...]
                var split = colors.match(this.digitsplit), i;
                for (i in filter[1]) {
                    if (filter[1].hasOwnProperty(i)) {
                        this.arrayReplace(split, i, filter[1][i]);
                    }
                }
                return split.join("");
            default:
                console.warn("Unknown filter: '" + filterName + "'.");
        }
        return colors;
    };
    /**
     * Converts an unraveled String of sprite numbers to the equivalent RGBA
     * Uint8ClampedArray. Each colors number will be represented by four numbers
     * in the output. This is the fourth Function called in the base processor.
     *
     * @param {String} colors
     * @return {Uint8ClampedArray}
     */
    PixelRendr.prototype.spriteGetArray = function (colors) {
        var clength = colors.length, numcolors = clength / this.digitsizeDefault, split = colors.match(this.digitsplit), olength = numcolors * 4, output = new Uint8ClampedArray(olength), reference, i, j, k;
        for (i = 0, j = 0; i < numcolors; ++i) {
            // Grab its RGBA ints
            reference = this.paletteDefault[Number(split[i])];
            for (k = 0; k < 4; ++k) {
                output[j + k] = reference[k];
            }
            j += 4;
        }
        return output;
    };
    /**
     * Repeats each row of a sprite based on the container attributes to create
     * the actual sprite (before now, the sprite was 1 / scale as high as it
     * should have been). This is the first Function called in the dimensions
     * processor.
     *
     * @param {Uint8ClampedArray} sprite
     * @param {String} key
     * @param {Object} attributes   The container Object (commonly a Thing in
     *                              GameStarter), which must contain width and
     *                              height numbers.
     * @return {Uint8ClampedArray}
     */
    PixelRendr.prototype.spriteRepeatRows = function (sprite, key, attributes) {
        var parsed = new Uint8ClampedArray(sprite.length * this.scale), rowsize = attributes[this.spriteWidth] * 4, heightscale = attributes[this.spriteHeight] * this.scale, readloc = 0, writeloc = 0, si, sj;
        for (si = 0; si < heightscale; ++si) {
            for (sj = 0; sj < this.scale; ++sj) {
                this.memcpyU8(sprite, parsed, readloc, writeloc, rowsize);
                writeloc += rowsize;
            }
            readloc += rowsize;
        }
        return parsed;
    };
    /**
     * Optionally flips a sprite based on the flipVert and flipHoriz keys. This
     * is the second Function in the dimensions processor and the last step
     * before a sprite is deemed usable.
     *
     * @param {Uint8ClampedArray} sprite
     * @param {String} key
     * @param {Object} attributes
     * @return {Uint8ClampedArray}
     */
    PixelRendr.prototype.spriteFlipDimensions = function (sprite, key, attributes) {
        if (key.indexOf(this.flipHoriz) !== -1) {
            if (key.indexOf(this.flipVert) !== -1) {
                return this.flipSpriteArrayBoth(sprite);
            }
            else {
                return this.flipSpriteArrayHoriz(sprite, attributes);
            }
        }
        else if (key.indexOf(this.flipVert) !== -1) {
            return this.flipSpriteArrayVert(sprite, attributes);
        }
        return sprite;
    };
    /**
     * Flips a sprite horizontally by reversing the pixels within each row. Rows
     * are computing using the spriteWidth in attributes.
     *
     * @param {Uint8ClampedArray} sprite
     * @param {Object} attributes
     * @return {Uint8ClampedArray}
     */
    PixelRendr.prototype.flipSpriteArrayHoriz = function (sprite, attributes) {
        var length = sprite.length, width = attributes[this.spriteWidth] + 0, newsprite = new Uint8ClampedArray(length), rowsize = width * 4, newloc, oldloc, i, j, k;
        for (i = 0; i < length; i += rowsize) {
            newloc = i;
            oldloc = i + rowsize - 4;
            for (j = 0; j < rowsize; j += 4) {
                for (k = 0; k < 4; ++k) {
                    newsprite[newloc + k] = sprite[oldloc + k];
                }
                newloc += 4;
                oldloc -= 4;
            }
        }
        return newsprite;
    };
    /**
     * Flips a sprite horizontally by reversing the order of the rows. Rows are
     * computing using the spriteWidth in attributes.
     *
     * @param {Uint8ClampedArray} sprite
     * @param {Object} attributes
     * @return {Uint8ClampedArray}
     */
    PixelRendr.prototype.flipSpriteArrayVert = function (sprite, attributes) {
        var length = sprite.length, width = attributes[this.spriteWidth] + 0, newsprite = new Uint8ClampedArray(length), rowsize = width * 4, newloc = 0, oldloc = length - rowsize, i, j;
        while (newloc < length) {
            for (i = 0; i < rowsize; i += 4) {
                for (j = 0; j < 4; ++j) {
                    newsprite[newloc + i + j] = sprite[oldloc + i + j];
                }
            }
            newloc += rowsize;
            oldloc -= rowsize;
        }
        return newsprite;
    };
    /**
     * Flips a sprite horizontally and vertically by reversing the order of the
     * pixels. This doesn't actually need attributes.
     *
     * @param {Uint8ClampedArray} sprite
     * @return {Uint8ClampedArray}
     */
    PixelRendr.prototype.flipSpriteArrayBoth = function (sprite) {
        var length = sprite.length, newsprite = new Uint8ClampedArray(length), oldloc = sprite.length - 4, newloc = 0, i;
        while (newloc < length) {
            for (i = 0; i < 4; ++i) {
                newsprite[newloc + i] = sprite[oldloc + i];
            }
            newloc += 4;
            oldloc -= 4;
        }
        return newsprite;
    };
    /* Encoding pipeline functions
    */
    /**
     * Retrives the raw pixel data from an image element. It is copied onto a
     * canvas, which as its context return the .getImageDate().data results.
     * This is the first Fiunction used in the encoding processor.
     *
     * @param {HTMLImageElement} image
     */
    PixelRendr.prototype.imageGetData = function (image) {
        var canvas = document.createElement("canvas"), context = canvas.getContext("2d");
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
    };
    /**
     * Determines which pixels occur in the data and at what frequency. This is
     * the second Function used in the encoding processor.
     *
     * @param {Uint8ClampedArray} data   The raw pixel data obtained from the
     *                                   imageData of a canvas.
     * @return {Array} [pixels, occurences], where pixels is an array of [rgba]
     *                 values and occurences is an Object mapping occurence
     *                 frequencies of palette colors in pisels.
     */
    PixelRendr.prototype.imageGetPixels = function (data) {
        var pixels = new Array(data.length / 4), occurences = {}, pixel, i, j;
        for (i = 0, j = 0; i < data.length; i += 4, j += 1) {
            pixel = this.getClosestInPalette(this.paletteDefault, data.subarray(i, i + 4));
            pixels[j] = pixel;
            if (occurences.hasOwnProperty(pixel)) {
                occurences[pixel] += 1;
            }
            else {
                occurences[pixel] = 1;
            }
        }
        return [pixels, occurences];
    };
    /**
     * Concretely defines the palette to be used for a new sprite. This is the
     * third Function used in the encoding processor, and creates a technically
     * usable (but uncompressed) sprite with information to compress it.
     *
     * @param {Array} information   [pixels, occurences], a result directly from
     *                              imageGetPixels.
     * @return {Array} [palette, numbers, digitsize], where palette is a
     *                 String[] of palette numbers, numbers is the actual sprite
     *                 data, and digitsize is the sprite's digit size.
     */
    PixelRendr.prototype.imageMapPalette = function (information) {
        var pixels = information[0], occurences = information[1], palette = Object.keys(occurences), digitsize = this.getDigitSize(palette), paletteIndices = this.getValueIndices(palette), numbers = pixels.map(this.getKeyValue.bind(undefined, paletteIndices));
        return [palette, numbers, digitsize];
    };
    /**
     * Compresses a nearly complete sprite from imageMapPalette into a
     * compressed, storage-ready String. This is the last Function in the
     * encoding processor.
     *
     * @param {Array} information   [palette, numbers, digitsize], a result
     *                              directly from imageMapPalette.
     * @return {String}
     */
    PixelRendr.prototype.imageCombinePixels = function (information) {
        var palette = information[0], numbers = information[1], digitsize = information[2], threshold = Math.max(3, Math.round(4 / digitsize)), output, current, digit, i = 0, j;
        output = "p[" + palette.map(this.makeSizedDigit.bind(undefined, digitsize)).join(",") + "]";
        while (i < numbers.length) {
            j = i + 1;
            current = numbers[i];
            digit = this.makeDigit(current, digitsize);
            while (current === numbers[j]) {
                j += 1;
            }
            if (j - i > threshold) {
                output += "x" + digit + String(j - i) + ",";
                i = j;
            }
            else {
                do {
                    output += digit;
                    i += 1;
                } while (i < j);
            }
        }
        return output;
    };
    /* Misc. utility functions
    */
    /**
     * @param {Array} palette
     * @return {Number} What the digitsize for a sprite that uses the palette
     *                  should be (how many digits it would take to represent
     *                  any index of the palettte).
     */
    PixelRendr.prototype.getDigitSize = function (palette) {
        return Math.floor(Math.log(palette.length) / Math.LN10) + 1;
    };
    /**
     * Generates an actual palette Object for a given palette, using a digitsize
     * calculated from the palette.
     *
     * @param {Array} palette
     * @return {Object} The actual palette Object for the given palette, with
     *                  an index for every palette member.
     */
    PixelRendr.prototype.getPaletteReference = function (palette) {
        var output = {}, digitsize = this.getDigitSize(palette), i;
        for (i = 0; i < palette.length; i += 1) {
            output[this.makeDigit(i, digitsize)] = this.makeDigit(palette[i], digitsize);
        }
        return output;
    };
    /**
     * Generates an actual palette Object for a given palette, using the default
     * digitsize.
     *
     * @param {Array} palette
     * @return {Object} The actual palette Object for the given palette, with
     *                  an index for every palette member.
     */
    PixelRendr.prototype.getPaletteReferenceStarting = function (palette) {
        var output = {}, i;
        for (i = 0; i < palette.length; i += 1) {
            output[this.makeDigit(i, this.digitsizeDefault)] = this.makeDigit(i, this.digitsizeDefault);
        }
        return output;
    };
    /**
     * Finds which rgba value in a palette is closest to a given value. This is
     * useful for determining which color in a pre-existing palette matches up
     * with a raw image's pixel. This is determined by which palette color has
     * the lowest total difference in integer values between r, g, b, and a.
     *
     * @param {Array} palette   The palette of pre-existing colors.
     * @param {Array} rgba   The RGBA values being assigned a color, as Numbers
     *                       in [0, 255].
     * @return {Number} The closest matching color index.
     */
    PixelRendr.prototype.getClosestInPalette = function (palette, rgba) {
        var bestDifference = Infinity, difference, bestIndex, i;
        for (i = palette.length - 1; i >= 0; i -= 1) {
            difference = this.arrayDifference(palette[i], rgba);
            if (difference < bestDifference) {
                bestDifference = difference;
                bestIndex = i;
            }
        }
        return bestIndex;
    };
    /**
     * Creates a new String equivalent to an old String repeated any number of
     * times. If times is 0, a blank String is returned.
     *
     * @param {String} string   The characters to repeat.
     * @param {Number} [times]   How many times to repeat (by default, 1).
     * @return {String}
     */
    PixelRendr.prototype.stringOf = function (str, times) {
        if (times === void 0) { times = 1; }
        return (times === 0) ? "" : new Array(1 + (times || 1)).join(str);
    };
    /**
     * Turns a Number into a String with a prefix added to pad it to a certain
     * number of digits.
     *
     * @param {Number} number   The original Number being padded.
     * @param {Number} size   How many digits the output must contain.
     * @param {String} [prefix]   A prefix to repeat for padding (by default,
     *                            "0").
     * @return {String}
     * @example
     * makeDigit(7, 3); // '007'
     * makeDigit(7, 3, 1); // '117'
     */
    PixelRendr.prototype.makeDigit = function (num, size, prefix) {
        if (prefix === void 0) { prefix = "0"; }
        return this.stringOf(prefix, Math.max(0, size - String(num).length)) + num;
    };
    /**
     * Curry wrapper around makeDigit that reverses size and number argument
     * order. Useful for binding makeDigit.
     *
     * @param {Number} number   The original Number being padded.
     * @param {Number} size   How many digits the output must contain.
     * @return {String}
     */
    PixelRendr.prototype.makeSizedDigit = function (size, num) {
        return this.makeDigit(num, size, "0");
    };
    /**
     * Replaces all instances of an element in an Array.
     *
     * @param {Array}
     * @param {Mixed} removed   The element to remove.
     * @param {Mixed} inserted   The element to insert.
     */
    PixelRendr.prototype.arrayReplace = function (array, removed, inserted) {
        for (var i = array.length - 1; i >= 0; i -= 1) {
            if (array[i] === removed) {
                array[i] = inserted;
            }
        }
        return array;
    };
    /**
     * Computes the sum of the differences of elements between two Arrays of
     * equal length.
     *
     * @param {Array} a
     * @param {Array} b
     * @return {Number}
     */
    PixelRendr.prototype.arrayDifference = function (a, b) {
        var sum = 0, i;
        for (i = a.length - 1; i >= 0; i -= 1) {
            sum += Math.abs(a[i] - b[i]) | 0;
        }
        return sum;
    };
    /**
     * @param {Array}
     * @return {Object} An Object with an index equal to each element of the
     *                  Array.
     */
    PixelRendr.prototype.getValueIndices = function (array) {
        var output = {}, i;
        for (i = 0; i < array.length; i += 1) {
            output[array[i]] = i;
        }
        return output;
    };
    /**
     * Curry Function to retrieve a member of an Object. Useful for binding.
     *
     * @param {Object} object
     * @param {String} key
     * @return {Mixed}
     */
    PixelRendr.prototype.getKeyValue = function (object, key) {
        return object[key];
    };
    /**
     * Follows a path inside an Object recursively, based on a given path.
     *
     * @param {Mixed} object
     * @param {String[]} path   The ordered names of attributes to descend into.
     * @param {Number} num   The starting index in path.
     * @return {Mixed}
     */
    PixelRendr.prototype.followPath = function (obj, path, num) {
        if (num < path.length && obj.hasOwnProperty(path[num])) {
            return this.followPath(obj[path[num]], path, num + 1);
        }
        return obj;
    };
    return PixelRendr;
})();
/**
 * ObjectMakr
 *
 * An Abstract Factory for JavaScript classes that automates the process of
 * setting constructors' prototypal inheritance. A sketch of class inheritance
 * and a listing of properties for each class is taken in, and dynamically
 * accessible function constructors are made available.
 *
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var ObjectMakr = (function () {
    /**
     * Resets the ObjectMakr.
     *
     * @constructor
     *
     * @param {Object} inheritance   The sketch of class inheritance, keyed by
     *                               name.
     * @param {Object} properties   Type properties for each Function.
     * @param {Boolean} [doPropertiesFull]   Whether a full property mapping
     *                                       should be made for each type (by
     *                                       default, false).
     * @param {Mixed} [indexMap]   Alternative aliases for properties as
     *                              shorthand.
     * @param {String} [onMake]   A String index for each generated Object's
     *                            Function to be run when made.
     */
    function ObjectMakr(settings) {
        if (typeof settings.inheritance === "undefined") {
            throw new Error("No inheritance mapping given to ObjectMakr.");
        }
        this.inheritance = settings.inheritance;
        this.properties = settings.properties || {};
        this.doPropertiesFull = settings.doPropertiesFull;
        this.indexMap = settings.indexMap;
        this.onMake = settings.onMake;
        this.functions = {};
        if (this.doPropertiesFull) {
            this.propertiesFull = {};
        }
        if (this.indexMap) {
            this.processProperties(this.properties);
        }
        this.processFunctions(this.inheritance, Object, "Object");
    }
    /* Simple gets
    */
    /**
     * @return {Object} The complete inheritance mapping Object.
     */
    ObjectMakr.prototype.getInheritance = function () {
        return this.inheritance;
    };
    /**
     * @return {Object} The complete properties mapping Object.
     */
    ObjectMakr.prototype.getProperties = function () {
        return this.properties;
    };
    /**
     * @return {Object} The properties Object for a particular class.
     */
    ObjectMakr.prototype.getPropertiesOf = function (title) {
        return this.properties[title];
    };
    /**
     * @return {Object} The full properties Object, if doPropertiesFull is on.
     */
    ObjectMakr.prototype.getFullProperties = function () {
        return this.propertiesFull;
    };
    /**
     * @return {Object} The full properties Object for a particular class, if
     *                  doPropertiesFull is on.
     */
    ObjectMakr.prototype.getFullPropertiesOf = function (title) {
        return this.doPropertiesFull ? this.propertiesFull[title] : undefined;
    };
    /**
     * @return {Object} The full mapping of class constructors.
     */
    ObjectMakr.prototype.getFunctions = function () {
        return this.functions;
    };
    /**
     * @param {String} type   The name of a class to retrieve.
     * @return {Function}   The constructor for the given class.
     */
    ObjectMakr.prototype.getFunction = function (type) {
        return this.functions[type];
    };
    /**
     * @param {String} type   The name of a class to check for.
     * @return {Boolean} Whether that class exists.
     */
    ObjectMakr.prototype.hasFunction = function (type) {
        return this.functions.hasOwnProperty(type);
    };
    /**
     * @return {Mixed} The optional mapping of indices.
     */
    ObjectMakr.prototype.getIndexMap = function () {
        return this.indexMap;
    };
    /* Core usage
    */
    /**
     * Creates a new instance of the given type and returns it.
     * If desired, any settings are applied to it (deep copy using proliferate).
     * @param {String} type   The type for which a new object of is being made.
     * @param {Objetct} [settings]   Additional attributes to add to the newly
     *                               created Object.
     * @return {Mixed}
     */
    ObjectMakr.prototype.make = function (type, settings) {
        var output;
        // Make sure the type actually exists in functions
        if (!this.functions.hasOwnProperty(type)) {
            throw new Error("Unknown type given to ObjectMakr: " + type);
        }
        // Create the new object, copying any given settings
        output = new this.functions[type]();
        if (settings) {
            this.proliferate(output, settings);
        }
        // onMake triggers are handled respecting doPropertiesFull.
        if (this.onMake && output[this.onMake]) {
            if (this.doPropertiesFull) {
                output[this.onMake](output, type, this.properties[type], this.propertiesFull[type]);
            }
            else {
                output[this.onMake](output, type, this.properties[type], this.functions[type].prototype);
            }
        }
        return output;
    };
    /* Core parsing
    */
    /**
     * Parser that calls processPropertyArray on all properties given as arrays
     * @param {Object} properties   The object of function properties
     * @remarks Only call this if indexMap is given as an array
     */
    ObjectMakr.prototype.processProperties = function (properties) {
        var name;
        for (name in properties) {
            if (this.properties.hasOwnProperty(name)) {
                // If it's an array, replace it with a mapped version
                if (this.properties[name] instanceof Array) {
                    this.properties[name] = this.processPropertyArray(this.properties[name]);
                }
            }
        }
    };
    /**
     * Creates an output properties object with the mapping shown in indexMap
     * @param {Array} properties   An array with indiced versions of properties
     * @example indexMap = ["width", "height"];
     *          properties = [7, 14];
     *          output = processPropertyArray(properties);
     *          // output is now { "width": 7, "height": 14 }
     */
    ObjectMakr.prototype.processPropertyArray = function (properties) {
        var output = {}, i;
        for (i = properties.length - 1; i >= 0; --i) {
            output[this.indexMap[i]] = properties[i];
        }
        return output;
    };
    /**
     * Recursive parser to generate each function, starting from the base.
     * @param {Object} base   An object whose keys are the names of functions to
     *                        made, and whose values are objects whose keys are
     *                        for children that inherit from these functions
     * @param {Function} parent   The parent function of the functions about to
     *                            be made
     * @param {String} parentName   The name of the parent Function to be
     *                              inherited from.
     * @remarks This may use eval, which is evil and almost never a good idea,
     *          but here it's the only way to make functions with dynamic names.
     */
    ObjectMakr.prototype.processFunctions = function (base, parent, parentName) {
        var name, ref;
        for (name in base) {
            if (base.hasOwnProperty(name)) {
                this.functions[name] = new Function();
                // This sets the function as inheriting from the parent
                this.functions[name].prototype = new parent();
                this.functions[name].prototype.constructor = this.functions[name];
                for (ref in this.properties[name]) {
                    if (this.properties[name].hasOwnProperty(ref)) {
                        this.functions[name].prototype[ref] = this.properties[name][ref];
                    }
                }
                // If the entire property tree is being mapped, copy everything
                // from both this and its parent to its equivalent
                if (this.doPropertiesFull) {
                    this.propertiesFull[name] = {};
                    if (parentName) {
                        for (ref in this.propertiesFull[parentName]) {
                            if (this.propertiesFull[parentName].hasOwnProperty(ref)) {
                                this.propertiesFull[name][ref] = this.propertiesFull[parentName][ref];
                            }
                        }
                    }
                    for (ref in this.properties[name]) {
                        if (this.properties[name].hasOwnProperty(ref)) {
                            this.propertiesFull[name][ref] = this.properties[name][ref];
                        }
                    }
                }
                this.processFunctions(base[name], this.functions[name], name);
            }
        }
    };
    /* Utilities
    */
    /**
     * Proliferates all members of the donor to the recipient recursively. This
     * is therefore a deep copy.
     * @param {Object} recipient   An object receiving the donor's members.
     * @param {Object} donor   An object whose members are copied to recipient.
     * @param {Boolean} noOverride   If recipient properties may be overriden.
     */
    ObjectMakr.prototype.proliferate = function (recipient, donor, noOverride) {
        if (noOverride === void 0) { noOverride = false; }
        var setting, i;
        for (i in donor) {
            // If noOverride is specified, don't override if it already exists
            if (noOverride && recipient.hasOwnProperty(i)) {
                continue;
            }
            // If it's an object, recurse on a new version of it
            setting = donor[i];
            if (typeof setting === "object") {
                if (!recipient.hasOwnProperty(i)) {
                    recipient[i] = new setting.constructor();
                }
                this.proliferate(recipient[i], setting, noOverride);
            }
            else {
                // Regular primitives are easy to copy otherwise
                recipient[i] = setting;
            }
        }
        return recipient;
    };
    return ObjectMakr;
})();
/// <reference path="ObjectMakr/ObjectMakr.ts" />
/**
 * Quadrant-based collision detection. A grid structure of Quadrants is kept,
 * with Things placed within quadrants they intersect. Each Quadrant knows which
 * Things are in it, and each Thing knows its quadrants. Operations are
 * available to shift quadrants horizontally or vertically and add/remove rows
 * and columns.
 *
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var QuadsKeepr = (function () {
    /**
     * Resets the QuadsKeepr.
     *
     * @constructor
     * @param {IQuadsKeeprSettings} settings
     */
    function QuadsKeepr(settings) {
        if (!settings.ObjectMaker) {
            throw new Error("No ObjectMaker given to QuadsKeepr.");
        }
        this.ObjectMaker = settings.ObjectMaker;
        if (!settings.numRows) {
            throw new Error("No numRows given to QuadsKeepr.");
        }
        this.numRows = settings.numRows;
        if (!settings.numCols) {
            throw new Error("No numCols given to QuadsKeepr.");
        }
        this.numCols = settings.numCols;
        if (!settings.quadrantWidth) {
            throw new Error("No quadrantWidth given to QuadsKeepr.");
        }
        this.quadrantWidth = settings.quadrantWidth | 0;
        if (!settings.quadrantHeight) {
            throw new Error("No quadrantHeight given to QuadsKeepr.");
        }
        this.quadrantHeight = settings.quadrantHeight | 0;
        if (!settings.groupNames) {
            throw new Error("No groupNames given to QuadsKeepr.");
        }
        this.groupNames = settings.groupNames;
        this.onAdd = settings.onAdd;
        this.onRemove = settings.onRemove;
        this.startLeft = settings.startLeft | 0;
        this.startTop = settings.startTop | 0;
        this.keyTop = settings.keyTop || "top";
        this.keyLeft = settings.keyLeft || "left";
        this.keyBottom = settings.keyBottom || "bottom";
        this.keyRight = settings.keyRight || "right";
        this.keyNumQuads = settings.keyNumQuads || "numquads";
        this.keyQuadrants = settings.keyQuadrants || "quadrants";
        this.keyChanged = settings.keyChanged || "changed";
        this.keyToleranceX = settings.keyToleranceX || "tolx";
        this.keyToleranceY = settings.keyToleranceY || "toly";
        this.keyGroupName = settings.keyGroupName || "group";
        this.keyOffsetX = settings.keyOffsetX;
        this.keyOffsetY = settings.keyOffsetY;
    }
    /* Simple gets
    */
    /**
     * @return {Object} The listing of Quadrants grouped by row.
     */
    QuadsKeepr.prototype.getQuadrantRows = function () {
        return this.quadrantRows;
    };
    /**
     * @return {Object} The listing of Quadrants grouped by column.
     */
    QuadsKeepr.prototype.getQuadrantCols = function () {
        return this.quadrantCols;
    };
    /**
     * @return {Number} How many Quadrant rows there are.
     */
    QuadsKeepr.prototype.getNumRows = function () {
        return this.numRows;
    };
    /**
     * @return {Number} How many Quadrant columns there are.
     */
    QuadsKeepr.prototype.getNumCols = function () {
        return this.numCols;
    };
    /**
     * @return {Number} How wide each Quadrant is.
     */
    QuadsKeepr.prototype.getQuadrantWidth = function () {
        return this.quadrantWidth;
    };
    /**
     * @return {Number} How high each Quadrant is.
     */
    QuadsKeepr.prototype.getQuadrantHeight = function () {
        return this.quadrantHeight;
    };
    /* Quadrant updates
    */
    /**
     * Completely resets all Quadrants. The grid structure of rows and columns
     * is remade according to startLeft and startTop, and newly created
     * Quadrants pushed into it.
     */
    QuadsKeepr.prototype.resetQuadrants = function () {
        var left = this.startLeft, top = this.startTop, quadrant, i, j;
        this.top = this.startTop;
        this.right = this.startLeft + this.quadrantWidth * this.numCols;
        this.bottom = this.startTop + this.quadrantHeight * this.numRows;
        this.left = this.startLeft;
        this.quadrantRows = [];
        this.quadrantCols = [];
        this.offsetX = 0;
        this.offsetY = 0;
        for (i = 0; i < this.numRows; i += 1) {
            this.quadrantRows.push({
                "left": this.startLeft,
                "top": top,
                "quadrants": []
            });
            top += this.quadrantHeight;
        }
        for (j = 0; j < this.numCols; j += 1) {
            this.quadrantCols.push({
                "left": left,
                "top": this.startTop,
                "quadrants": []
            });
            left += this.quadrantWidth;
        }
        top = this.startTop;
        for (i = 0; i < this.numRows; i += 1) {
            left = this.startLeft;
            for (j = 0; j < this.numCols; j += 1) {
                quadrant = this.createQuadrant(left, top);
                this.quadrantRows[i].quadrants.push(quadrant);
                this.quadrantCols[j].quadrants.push(quadrant);
                left += this.quadrantWidth;
            }
            top += this.quadrantHeight;
        }
        if (this.onAdd) {
            this.onAdd("xInc", this.top, this.right, this.bottom, this.left);
        }
    };
    /**
     * Shifts each Quadrant horizontally and vertically, along with the row and
     * column containers. Offsets are adjusted to check for row or column
     * deletion and insertion.
     *
     * @param {Number} dx   How much to shfit horizontally (will be rounded).
     * @param {Number} dy   How much to shift vertically (will be rounded).
     */
    QuadsKeepr.prototype.shiftQuadrants = function (dx, dy) {
        if (dx === void 0) { dx = 0; }
        if (dy === void 0) { dy = 0; }
        var row, col;
        dx = dx | 0;
        dy = dy | 0;
        this.offsetX += dx;
        this.offsetY += dy;
        this.top += dy;
        this.right += dx;
        this.bottom += dy;
        this.left += dx;
        for (row = 0; row < this.numRows; row += 1) {
            this.quadrantRows[row].left += dx;
            this.quadrantRows[row].top += dy;
        }
        for (col = 0; col < this.numCols; col += 1) {
            this.quadrantCols[col].left += dx;
            this.quadrantCols[col].top += dy;
        }
        for (row = 0; row < this.numRows; row += 1) {
            for (col = 0; col < this.numCols; col += 1) {
                this.shiftQuadrant(this.quadrantRows[row].quadrants[col], dx, dy);
            }
        }
        this.adjustOffsets();
    };
    /**
     * Adds a QuadrantRow to the end of the quadrantRows Array.
     *
     * @param {Boolean} [callUpdate]   Whether this should call the onAdd
     *                                 trigger with the new row's bounding box.
     */
    QuadsKeepr.prototype.pushQuadrantRow = function (callUpdate) {
        if (callUpdate === void 0) { callUpdate = false; }
        var row = this.createQuadrantRow(this.left, this.bottom), i;
        this.numRows += 1;
        this.quadrantRows.push(row);
        for (i = 0; i < this.quadrantCols.length; i += 1) {
            this.quadrantCols[i].quadrants.push(row.quadrants[i]);
        }
        this.bottom += this.quadrantHeight;
        if (callUpdate && this.onAdd) {
            this.onAdd("yInc", this.bottom, this.right, this.bottom - this.quadrantHeight, this.left);
        }
        return row;
    };
    /**
     * Adds a QuadrantCol to the end of the quadrantCols Array.
     *
     * @param {Boolean} [callUpdate]   Whether this should call the onAdd
     *                                 trigger with the new col's bounding box.
     */
    QuadsKeepr.prototype.pushQuadrantCol = function (callUpdate) {
        if (callUpdate === void 0) { callUpdate = false; }
        var col = this.createQuadrantCol(this.right, this.top), i;
        this.numCols += 1;
        this.quadrantCols.push(col);
        for (i = 0; i < this.quadrantRows.length; i += 1) {
            this.quadrantRows[i].quadrants.push(col.quadrants[i]);
        }
        this.right += this.quadrantWidth;
        if (callUpdate && this.onAdd) {
            this.onAdd("xInc", this.top, this.right - this.offsetY, this.bottom, this.right - this.quadrantWidth - this.offsetY);
        }
        return col;
    };
    /**
     * Removes the last QuadrantRow from the end of the quadrantRows Array.
     *
     * @param {Boolean} [callUpdate]   Whether this should call the onRemove
     *                                 trigger with the new row's bounding box.
     */
    QuadsKeepr.prototype.popQuadrantRow = function (callUpdate) {
        if (callUpdate === void 0) { callUpdate = false; }
        for (var i = 0; i < this.quadrantCols.length; i += 1) {
            this.quadrantCols[i].quadrants.pop();
        }
        this.numRows -= 1;
        this.quadrantRows.pop();
        if (callUpdate && this.onRemove) {
            this.onRemove("yInc", this.bottom, this.right, this.bottom - this.quadrantHeight, this.left);
        }
        this.bottom -= this.quadrantHeight;
    };
    /**
     * Removes the last QuadrantCol from the end of the quadrantCols Array.
     *
     * @param {Boolean} [callUpdate]   Whether this should call the onRemove
     *                                 trigger with the new row's bounding box.
     */
    QuadsKeepr.prototype.popQuadrantCol = function (callUpdate) {
        if (callUpdate === void 0) { callUpdate = false; }
        for (var i = 0; i < this.quadrantRows.length; i += 1) {
            this.quadrantRows[i].quadrants.pop();
        }
        this.numCols -= 1;
        this.quadrantCols.pop();
        if (callUpdate && this.onRemove) {
            this.onRemove("xDec", this.top, this.right - this.offsetY, this.bottom, this.right - this.quadrantWidth - this.offsetY);
        }
        this.right -= this.quadrantWidth;
    };
    /**
     * Adds a QuadrantRow to the beginning of the quadrantRows Array.
     *
     * @param {Boolean} [callUpdate]   Whether this should call the onAdd
     *                                 trigger with the new row's bounding box.
     */
    QuadsKeepr.prototype.unshiftQuadrantRow = function (callUpdate) {
        if (callUpdate === void 0) { callUpdate = false; }
        var row = this.createQuadrantRow(this.left, this.top - this.quadrantHeight), i;
        this.numRows += 1;
        this.quadrantRows.unshift(row);
        for (i = 0; i < this.quadrantCols.length; i += 1) {
            this.quadrantCols[i].quadrants.unshift(row.quadrants[i]);
        }
        this.top -= this.quadrantHeight;
        if (callUpdate && this.onAdd) {
            this.onAdd("yInc", this.top, this.right, this.top + this.quadrantHeight, this.left);
        }
        return row;
    };
    /**
     * Adds a QuadrantCol to the beginning of the quadrantCols Array.
     *
     * @param {Boolean} [callUpdate]   Whether this should call the onAdd
     *                                 trigger with the new row's bounding box.
     */
    QuadsKeepr.prototype.unshiftQuadrantCol = function (callUpdate) {
        if (callUpdate === void 0) { callUpdate = false; }
        var col = this.createQuadrantCol(this.left - this.quadrantWidth, this.top), i;
        this.numCols += 1;
        this.quadrantCols.unshift(col);
        for (i = 0; i < this.quadrantRows.length; i += 1) {
            this.quadrantRows[i].quadrants.unshift(col.quadrants[i]);
        }
        this.left -= this.quadrantWidth;
        if (callUpdate && this.onAdd) {
            this.onAdd("xInc", this.top, this.left, this.bottom, this.left + this.quadrantWidth);
        }
        return col;
    };
    /**
     * Removes a QuadrantRow from the beginning of the quadrantRows Array.
     *
     * @param {Boolean} [callUpdate]   Whether this should call the onAdd
     *                                 trigger with the new row's bounding box.
     */
    QuadsKeepr.prototype.shiftQuadrantRow = function (callUpdate) {
        if (callUpdate === void 0) { callUpdate = false; }
        for (var i = 0; i < this.quadrantCols.length; i += 1) {
            this.quadrantCols[i].quadrants.shift();
        }
        this.numRows -= 1;
        this.quadrantRows.pop();
        if (callUpdate && this.onRemove) {
            this.onRemove("yInc", this.top, this.right, this.top + this.quadrantHeight, this.left);
        }
        this.top += this.quadrantHeight;
    };
    /**
     * Removes a QuadrantCol from the beginning of the quadrantCols Array.
     *
     * @param {Boolean} callUpdate   Whether this should call the onAdd
     *                               trigger with the new row's bounding box.
     */
    QuadsKeepr.prototype.shiftQuadrantCol = function (callUpdate) {
        if (callUpdate === void 0) { callUpdate = false; }
        for (var i = 0; i < this.quadrantRows.length; i += 1) {
            this.quadrantRows[i].quadrants.shift();
        }
        this.numCols -= 1;
        this.quadrantCols.pop();
        if (callUpdate && this.onRemove) {
            this.onRemove("xInc", this.top, this.left + this.quadrantWidth, this.bottom, this.left);
        }
        this.left += this.quadrantWidth;
    };
    /* Thing manipulations
    */
    /**
     * Determines the Quadrants for an entire Array of Things. This is done by
     * wiping each quadrant's memory of that Array's group type and determining
     * each Thing's quadrants.
     *
     * @param {String} group   The name of the group to have Quadrants determined.
     * @param {Thing[]} things   The listing of Things in that group.
     */
    QuadsKeepr.prototype.determineAllQuadrants = function (group, things) {
        var row, col;
        for (row = 0; row < this.numRows; row += 1) {
            for (col = 0; col < this.numCols; col += 1) {
                this.quadrantRows[row].quadrants[col].numthings[group] = 0;
            }
        }
        things.forEach(this.determineThingQuadrants.bind(this));
    };
    /**
     * Determines the Quadrants for a single Thing. The starting row and column
     * indices are calculated so every Quadrant within them should contain the
     * Thing. In the process, its old Quadrants and new Quadrants are marked as
     * changed if it was.
     *
     * @param {Thing} thing
     */
    QuadsKeepr.prototype.determineThingQuadrants = function (thing) {
        var group = thing[this.keyGroupName], rowStart = this.findQuadrantRowStart(thing), colStart = this.findQuadrantColStart(thing), rowEnd = this.findQuadrantRowEnd(thing), colEnd = this.findQuadrantColEnd(thing), row, col;
        // Mark each of the Thing's Quadrants as changed
        // This is done first because the old Quadrants are changed
        if (thing[this.keyChanged]) {
            this.markThingQuadrantsChanged(thing);
        }
        // The Thing no longer has any Quadrants: rebuild them!
        thing[this.keyNumQuads] = 0;
        for (row = rowStart; row <= rowEnd; row += 1) {
            for (col = colStart; col <= colEnd; col += 1) {
                this.setThingInQuadrant(thing, this.quadrantRows[row].quadrants[col], group);
            }
        }
        // The thing is no longer considered changed, since quadrants know it
        thing[this.keyChanged] = false;
    };
    /**
     * Sets a Thing to be inside a Quadrant. The two are marked so they can
     * recognize each other's existence later.
     *
     * @param {Thing} thing
     * @param {Quadrant} quadrant
     * @param {String} group   The grouping under which the Quadrant should
     *                         store the Thing.
     */
    QuadsKeepr.prototype.setThingInQuadrant = function (thing, quadrant, group) {
        // Mark the Quadrant in the Thing
        thing[this.keyQuadrants][thing[this.keyNumQuads]] = quadrant;
        thing[this.keyNumQuads] += 1;
        // Mark the Thing in the Quadrant
        quadrant.things[group][quadrant.numthings[group]] = thing;
        quadrant.numthings[group] += 1;
        // If necessary, mark the Quadrant as changed
        if (thing[this.keyChanged]) {
            quadrant.changed = true;
        }
    };
    /* Internal rearranging
    */
    /**
     * Adjusts the offset measurements by checking if rows or columns have gone
     * over the limit, which requires rows or columns be removed and new ones
     * added.
     */
    QuadsKeepr.prototype.adjustOffsets = function () {
        while (-this.offsetX > this.quadrantWidth) {
            this.shiftQuadrantCol(true);
            this.pushQuadrantCol(true);
            this.offsetX += this.quadrantWidth;
        }
        while (this.offsetX > this.quadrantWidth) {
            this.popQuadrantCol(true);
            this.unshiftQuadrantCol(true);
            this.offsetX -= this.quadrantWidth;
        }
        while (-this.offsetY > this.quadrantHeight) {
            this.unshiftQuadrantRow(true);
            this.pushQuadrantRow(true);
            this.offsetY += this.quadrantHeight;
        }
        while (this.offsetY > this.quadrantHeight) {
            this.popQuadrantRow(true);
            this.unshiftQuadrantRow(true);
            this.offsetY -= this.quadrantHeight;
        }
    };
    /**
     * Shifts a Quadrant horizontally and vertically.
     *
     * @param {Number} dx
     * @param {Number} dy
     */
    QuadsKeepr.prototype.shiftQuadrant = function (quadrant, dx, dy) {
        quadrant.top += dy;
        quadrant.right += dx;
        quadrant.bottom += dy;
        quadrant.left += dx;
        quadrant.changed = true;
    };
    /* Quadrant placements
    */
    /**
     * Creates a new Quadrant using the internal ObjectMaker. The Quadrant's
     * sizing and position are set, along with a canvas element for rendering.
     *
     * @param {Number} left   The horizontal displacement of the Quadrant.
     * @param {Number} top   The vertical displacement of the Quadrant.
     * @return {Quadrant}
     */
    QuadsKeepr.prototype.createQuadrant = function (left, top) {
        var quadrant = this.ObjectMaker.make("Quadrant"), i;
        quadrant.changed = true;
        quadrant.things = {};
        quadrant.numthings = {};
        for (i = 0; i < this.groupNames.length; i += 1) {
            quadrant.things[this.groupNames[i]] = [];
            quadrant.numthings[this.groupNames[i]] = 0;
        }
        quadrant.left = left;
        quadrant.top = top;
        quadrant.right = left + this.quadrantWidth;
        quadrant.bottom = top + this.quadrantHeight;
        quadrant.canvas = this.createCanvas(this.quadrantWidth, this.quadrantHeight);
        quadrant.context = quadrant.canvas.getContext("2d");
        return quadrant;
    };
    /**
     * Creates a QuadrantRow, with length determined by numCols.
     *
     * @param {Number} left   The initial horizontal displacement of the col.
     * @param {Number} top   The vertical displacement of the col.
     * @return {QuadrantRow[]}
     */
    QuadsKeepr.prototype.createQuadrantRow = function (left, top) {
        if (left === void 0) { left = 0; }
        if (top === void 0) { top = 0; }
        var row = {
            "left": left,
            "top": top,
            "quadrants": []
        }, i;
        for (i = 0; i < this.numCols; i += 1) {
            row.quadrants.push(this.createQuadrant(left, top));
            left += this.quadrantWidth;
        }
        return row;
    };
    /**
     * Creates a QuadrantCol, with length determined by numRow.
     *
     * @param {Number} left   The horizontal displacement of the col.
     * @param {Number} top   The initial vertical displacement of the col.
     * @return {QuadrantRow[]}
     */
    QuadsKeepr.prototype.createQuadrantCol = function (left, top) {
        var col = {
            "left": left,
            "top": top,
            "quadrants": []
        }, i;
        for (i = 0; i < this.numRows; i += 1) {
            col.quadrants.push(this.createQuadrant(left, top));
            top += this.quadrantHeight;
        }
        return col;
    };
    /* Position utilities
    */
    /**
     * @param {Thing} thing
     * @return {Number} The Thing's top position, accounting for vertical
     *                  offset if needed.
     */
    QuadsKeepr.prototype.getTop = function (thing) {
        if (this.keyOffsetY) {
            return thing[this.keyTop] - Math.abs(thing[this.keyOffsetY]);
        }
        else {
            return thing[this.keyTop];
        }
    };
    /**
     * @param {Thing} thing
     * @return {Number} The Thing's right position, accounting for horizontal
     *                  offset if needed.
     */
    QuadsKeepr.prototype.getRight = function (thing) {
        if (this.keyOffsetX) {
            return thing[this.keyRight] + Math.abs(thing[this.keyOffsetX]);
        }
        else {
            return thing[this.keyRight];
        }
    };
    /**
     * @param {Thing} thing
     * @return {Number} The Thing's bottom position, accounting for vertical
     *                  offset if needed.
     */
    QuadsKeepr.prototype.getBottom = function (thing) {
        if (this.keyOffsetX) {
            return thing[this.keyBottom] + Math.abs(thing[this.keyOffsetY]);
        }
        else {
            return thing[this.keyBottom];
        }
    };
    /**
     * @param {Thing} thing
     * @return {Number} The Thing's left position, accounting for horizontal
     *                  offset if needed.
     */
    QuadsKeepr.prototype.getLeft = function (thing) {
        if (this.keyOffsetX) {
            return thing[this.keyLeft] - Math.abs(thing[this.keyOffsetX]);
        }
        else {
            return thing[this.keyLeft];
        }
    };
    /**
     * Marks all Quadrants a Thing is contained within as changed.
     */
    QuadsKeepr.prototype.markThingQuadrantsChanged = function (thing) {
        for (var i = 0; i < thing[this.keyNumQuads]; i += 1) {
            thing[this.keyQuadrants][i].changed = true;
        }
    };
    /**
     * @param {Thing} thing
     * @param {Number} The index of the first row the Thing is inside.
     */
    QuadsKeepr.prototype.findQuadrantRowStart = function (thing) {
        return Math.max(Math.floor((this.getTop(thing) - this.top) / this.quadrantHeight), 0);
    };
    /**
     * @param {Thing} thing
     * @param {Number} The index of the last row the Thing is inside.
     */
    QuadsKeepr.prototype.findQuadrantRowEnd = function (thing) {
        return Math.min(Math.floor((this.getBottom(thing) - this.top) / this.quadrantHeight), this.numRows - 1);
    };
    /**
     * @param {Thing} thing
     * @param {Number} The index of the first column the Thing is inside.
     */
    QuadsKeepr.prototype.findQuadrantColStart = function (thing) {
        return Math.max(Math.floor((this.getLeft(thing) - this.left) / this.quadrantWidth), 0);
    };
    /**
     * @param {Thing} thing
     * @param {Number} The index of the last column the Thing is inside.
     */
    QuadsKeepr.prototype.findQuadrantColEnd = function (thing) {
        return Math.min(Math.floor((this.getRight(thing) - this.left) / this.quadrantWidth), this.numCols - 1);
    };
    /**
     * Creates a new canvas element of the given size.
     *
     * @param {Number} width   How wide the canvas should be.
     * @param {Number} height   How tall the canvas should be.
     * @return {HTMLCanvasElement}
     */
    QuadsKeepr.prototype.createCanvas = function (width, height) {
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    };
    return QuadsKeepr;
})();
/// <reference path="MapScreenr/MapScreenr.ts" />
/// <reference path="PixelRendr/PixelRendr.ts" />
/// <reference path="QuadsKeepr/QuadsKeepr.ts" />
/**
 * PixelDrawr.js
 *
 * A front-end to PixelRendr to automate drawing mass amounts of sprites to a
 * primary canvas. A PixelRendr keeps track of sprite sources, while a
 * MapScreenr maintains boundary information on the screen. Global screen
 * refills may be done by drawing every Thing in the thingArrays, or by
 * Quadrants as a form of dirty rectangles.
 *
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var PixelDrawr = (function () {
    /**
     * Resets the PixelDrawr.
     *
     * @constructor
     * @param {IPixelDrawrSettings} settings
     */
    function PixelDrawr(settings) {
        this.PixelRender = settings.PixelRender;
        this.MapScreener = settings.MapScreener;
        this.createCanvas = settings.createCanvas;
        this.unitsize = settings.unitsize || 1;
        this.noRefill = settings.noRefill;
        this.spriteCacheCutoff = settings.spriteCacheCutoff || 0;
        this.groupNames = settings.groupNames;
        this.framerateSkip = settings.framerateSkip || 1;
        this.framesDrawn = 0;
        this.epsilon = settings.epsilon || .007;
        this.keyWidth = settings.keyWidth || "width";
        this.keyHeight = settings.keyHeight || "height";
        this.keyTop = settings.keyTop || "top";
        this.keyRight = settings.keyRight || "right";
        this.keyBottom = settings.keyBottom || "bottom";
        this.keyLeft = settings.keyLeft || "left";
        this.keyOffsetX = settings.keyOffsetX;
        this.keyOffsetY = settings.keyOffsetY;
        this.generateObjectKey = settings.generateObjectKey || function (thing) {
            return thing.toString();
        };
        this.resetBackground();
    }
    /* Simple gets
    */
    /**
     * @return {Number} How often refill calls should be skipped.
     */
    PixelDrawr.prototype.getFramerateSkip = function () {
        return this.framerateSkip;
    };
    /**
     * @return {Array[]} The Arrays to be redrawn during refill calls.
     */
    PixelDrawr.prototype.getThingArray = function () {
        return this.thingArrays;
    };
    /**
     * @return {HTMLCanvasElement} The canvas element each Thing is to drawn on.
     */
    PixelDrawr.prototype.getCanvas = function () {
        return this.canvas;
    };
    /**
     * @return {CanvasRenderingContext2D} The 2D canvas context associated with
     *                                    the canvas.
     */
    PixelDrawr.prototype.getContext = function () {
        return this.context;
    };
    /**
     * @return {HTMLCanvasElement} The canvas element used for the background.
     */
    PixelDrawr.prototype.getBackgroundCanvas = function () {
        return this.backgroundCanvas;
    };
    /**
     * @return {CanvasRenderingContext2D} The 2D canvas context associated with
     *                                    the background canvas.
     */
    PixelDrawr.prototype.getBackgroundContext = function () {
        return this.backgroundContext;
    };
    /**
     * @return {Boolean} Whether refills should skip redrawing the background
     *                   each time.
     */
    PixelDrawr.prototype.getNoRefill = function () {
        return this.noRefill;
    };
    /**
     * @return {Number} The minimum opacity that will be drawn.
     */
    PixelDrawr.prototype.getEpsilon = function () {
        return this.epsilon;
    };
    /* Simple sets
    */
    /**
     * @param {Number} framerateSkip   How often refill calls should be skipped.
     */
    PixelDrawr.prototype.setFramerateSkip = function (framerateSkip) {
        this.framerateSkip = framerateSkip;
    };
    /**
     * @param {Array[]} thingArrays   The Arrays to be redrawn during refill calls.
     */
    PixelDrawr.prototype.setThingArrays = function (thingArrays) {
        this.thingArrays = thingArrays;
    };
    /**
     * Sets the currently drawn canvas and context, and recreates
     * drawThingOnContextBound.
     *
     * @param {HTMLCanvasElement} canvas   The new primary canvas to be used.
     */
    PixelDrawr.prototype.setCanvas = function (canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
    };
    /**
     * @param {Boolean} noRefill   Whether refills should now skip redrawing the
     *                             background each time.
     */
    PixelDrawr.prototype.setNoRefill = function (noRefill) {
        this.noRefill = noRefill;
    };
    /**
     * @param {Number} The minimum opacity that will be drawn.
     */
    PixelDrawr.prototype.setEpsilon = function (epsilon) {
        this.epsilon = epsilon;
    };
    /* Background manipulations
    */
    /**
     * Creates a new canvas the size of MapScreener and sets the background
     * canvas to it, then recreates backgroundContext.
     */
    PixelDrawr.prototype.resetBackground = function () {
        this.backgroundCanvas = this.createCanvas(this.MapScreener[this.keyWidth], this.MapScreener[this.keyHeight]);
        this.backgroundContext = this.backgroundCanvas.getContext("2d");
    };
    /**
     * Refills the background canvas with a new fillStyle.
     *
     * @param {Mixed} fillStyle   The new fillStyle for the background context.
     */
    PixelDrawr.prototype.setBackground = function (fillStyle) {
        this.backgroundContext.fillStyle = fillStyle;
        this.backgroundContext.fillRect(0, 0, this.MapScreener[this.keyWidth], this.MapScreener[this.keyHeight]);
    };
    /**
     * Draws the background canvas onto the main canvas' context.
     */
    PixelDrawr.prototype.drawBackground = function () {
        this.context.drawImage(this.backgroundCanvas, 0, 0);
    };
    /* Core rendering
    */
    /**
     * Goes through all the motions of finding and parsing a Thing's sprite.
     * This should be called whenever the sprite's appearance changes.
     *
     * @param {Thing} thing   A Thing whose sprite must be updated.
     * @return {Self}
     */
    PixelDrawr.prototype.setThingSprite = function (thing) {
        // If it's set as hidden, don't bother updating it
        if (thing.hidden) {
            return;
        }
        // PixelRender does most of the work in fetching the rendered sprite
        thing.sprite = this.PixelRender.decode(this.generateObjectKey(thing), thing);
        // To do: remove dependency on .numSprites
        // For now, kit's used to know whether it's had its sprite set, but 
        // wouldn't physically having a .sprite do that?
        if (thing.sprite.multiple) {
            thing.numSprites = 0;
            this.refillThingCanvasMultiple(thing);
        }
        else {
            thing.numSprites = 1;
            this.refillThingCanvasSingle(thing);
        }
    };
    /**
     * Simply draws a thing's sprite to its canvas by getting and setting
     * a canvas::imageData object via context.getImageData(...).
     *
     * @param {Thing} thing   A Thing whose canvas must be updated.
     */
    PixelDrawr.prototype.refillThingCanvasSingle = function (thing) {
        // Don't draw small Things.
        if (thing[this.keyWidth] < 1 || thing[this.keyHeight] < 1) {
            return;
        }
        // Retrieve the imageData from the Thing's canvas & renderingContext
        var canvas = thing.canvas, context = thing.context, imageData = context.getImageData(0, 0, canvas[this.keyWidth], canvas[this.keyHeight]);
        // Copy the thing's sprite to that imageData and into the contextz
        this.PixelRender.memcpyU8(thing.sprite, imageData.data);
        context.putImageData(imageData, 0, 0);
    };
    /**
     * For SpriteMultiples, this copies the sprite information for each
     * sub-sprite into its own canvas, sets thing.sprites, then draws the newly
     * rendered information onto the thing's canvas.
     *
     * @param {Thing} thing   A Thing whose canvas and sprites must be updated.
     */
    PixelDrawr.prototype.refillThingCanvasMultiple = function (thing) {
        if (thing[this.keyWidth] < 1 || thing[this.keyHeight] < 1) {
            return;
        }
        var spritesRaw = thing.sprite, canvases = thing.canvases = {
            "direction": spritesRaw.direction,
            "multiple": true
        }, canvas, context, imageData, i;
        thing.numSprites = 1;
        for (i in spritesRaw.sprites) {
            if (!spritesRaw.sprites.hasOwnProperty(i)) {
                continue;
            }
            // Make a new sprite for this individual component
            canvas = this.createCanvas(thing.spritewidth * this.unitsize, thing.spriteheight * this.unitsize);
            context = canvas.getContext("2d");
            // Copy over this sprite's information the same way as refillThingCanvas
            imageData = context.getImageData(0, 0, canvas[this.keyWidth], canvas[this.keyHeight]);
            this.PixelRender.memcpyU8(spritesRaw.sprites[i], imageData.data);
            context.putImageData(imageData, 0, 0);
            // Record the canvas and context in thing.sprites
            canvases[i] = {
                "canvas": canvas,
                "context": context
            };
            thing.numSprites += 1;
        }
        // Only pre-render multiple sprites if they're below the cutoff
        if (thing[this.keyWidth] * thing[this.keyHeight] < this.spriteCacheCutoff) {
            thing.canvas[this.keyWidth] = thing[this.keyWidth] * this.unitsize;
            thing.canvas[this.keyHeight] = thing[this.keyHeight] * this.unitsize;
            this.drawThingOnContextMultiple(thing.context, thing.canvases, thing, 0, 0);
        }
        else {
            thing.canvas[this.keyWidth] = thing.canvas[this.keyHeight] = 0;
        }
    };
    /* Core drawing
    */
    /**
     * Called every upkeep to refill the entire main canvas. All Thing arrays
     * are made to call this.refillThingArray in order.
     */
    PixelDrawr.prototype.refillGlobalCanvas = function () {
        this.framesDrawn += 1;
        if (this.framesDrawn % this.framerateSkip !== 0) {
            return;
        }
        if (!this.noRefill) {
            this.drawBackground();
        }
        for (var i = 0; i < this.thingArrays.length; i += 1) {
            this.refillThingArray(this.thingArrays[i]);
        }
    };
    /**
     * Calls drawThingOnContext on each Thing in the Array.
     *
     * @param {Thing[]} array   A listing of Things to be drawn onto the canvas.
     */
    PixelDrawr.prototype.refillThingArray = function (array) {
        for (var i = 0; i < array.length; i += 1) {
            this.drawThingOnContext(this.context, array[i]);
        }
    };
    /**
     * Refills the main canvas by calling refillQuadrants on each Quadrant in
     * the groups.
     *
     * @param {QuadrantRow[]} groups   QuadrantRows (or QuadrantCols) to be
     *                                 redrawn to the canvas.
     */
    PixelDrawr.prototype.refillQuadrantGroups = function (groups) {
        var i;
        this.framesDrawn += 1;
        if (this.framesDrawn % this.framerateSkip !== 0) {
            return;
        }
        for (i = 0; i < groups.length; i += 1) {
            this.refillQuadrants(groups[i].quadrants);
        }
    };
    /**
     * Refills (part of) the main canvas by drawing each Quadrant's canvas onto
     * it.
     *
     * @param {Quadrant[]} quadrants   The Quadrants to have their canvases
     *                                 refilled.
     */
    PixelDrawr.prototype.refillQuadrants = function (quadrants) {
        var quadrant, i;
        for (i = 0; i < quadrants.length; i += 1) {
            quadrant = quadrants[i];
            if (quadrant.changed && quadrant[this.keyTop] < this.MapScreener[this.keyHeight] && quadrant[this.keyRight] > 0 && quadrant[this.keyBottom] > 0 && quadrant[this.keyLeft] < this.MapScreener[this.keyWidth]) {
                this.refillQuadrant(quadrant);
                this.context.drawImage(quadrant.canvas, quadrant[this.keyLeft], quadrant[this.keyTop]);
            }
        }
    };
    /**
     * Refills a Quadrants's canvas by resetting its background and drawing all
     * its Things onto it.
     *
     * @param {Quadrant} quadrant   A quadrant whose Things must be drawn onto
     *                              its canvas.
     */
    PixelDrawr.prototype.refillQuadrant = function (quadrant) {
        var group, i, j;
        // This may be what's causing such bad performance.
        if (!this.noRefill) {
            quadrant.context.drawImage(this.backgroundCanvas, quadrant[this.keyLeft], quadrant[this.keyTop], quadrant.canvas[this.keyWidth], quadrant.canvas[this.keyHeight], 0, 0, quadrant.canvas[this.keyWidth], quadrant.canvas[this.keyHeight]);
        }
        for (i = this.groupNames.length - 1; i >= 0; i -= 1) {
            group = quadrant.things[this.groupNames[i]];
            for (j = 0; j < group.length; j += 1) {
                this.drawThingOnQuadrant(group[j], quadrant);
            }
        }
        quadrant.changed = false;
    };
    /**
     * General Function to draw a Thing onto a context. This will call
     * drawThingOnContext[Single/Multiple] with more arguments
     *
     * @param {CanvasRenderingContext2D} context   The context to have the Thing
     *                                             drawn on it.
     * @param {Thing} thing   The Thing to be drawn onto the context.
     */
    PixelDrawr.prototype.drawThingOnContext = function (context, thing) {
        if (thing.hidden || thing.opacity < this.epsilon || thing[this.keyHeight] < 1 || thing[this.keyWidth] < 1 || this.getTop(thing) > this.MapScreener[this.keyHeight] || this.getRight(thing) < 0 || this.getBottom(thing) < 0 || this.getLeft(thing) > this.MapScreener[this.keyWidth]) {
            return;
        }
        // If Thing hasn't had a sprite yet (previously hidden), do that first
        if (typeof thing.numSprites === "undefined") {
            this.setThingSprite(thing);
        }
        // Whether or not the thing has a regular sprite or a SpriteMultiple, 
        // that sprite has already been drawn to the thing's canvas, unless it's
        // above the cutoff, in which case that logic happens now.
        if (thing.canvas[this.keyWidth] > 0) {
            this.drawThingOnContextSingle(context, thing.canvas, thing, this.getLeft(thing), this.getTop(thing));
        }
        else {
            this.drawThingOnContextMultiple(context, thing.canvases, thing, this.getLeft(thing), this.getTop(thing));
        }
    };
    /**
     * Draws a Thing onto a quadrant's canvas. This is a simple wrapper around
     * drawThingOnContextSingle/Multiple that also bounds checks.
     *
     * @param {Thing} thing
     * @param {Quadrant} quadrant
     */
    PixelDrawr.prototype.drawThingOnQuadrant = function (thing, quadrant) {
        if (thing.hidden || this.getTop(thing) > quadrant[this.keyBottom] || this.getRight(thing) < quadrant[this.keyLeft] || this.getBottom(thing) < quadrant[this.keyTop] || this.getLeft(thing) > quadrant[this.keyRight] || thing.opacity < this.epsilon) {
            return;
        }
        // If there's just one sprite, it's pretty simple
        if (thing.numSprites === 1) {
            return this.drawThingOnContextSingle(quadrant.context, thing.canvas, thing, this.getLeft(thing) - quadrant[this.keyLeft], this.getTop(thing) - quadrant[this.keyTop]);
        }
        else {
            // For multiple sprites, some calculations will be needed
            return this.drawThingOnContextMultiple(quadrant.context, thing.canvases, thing, this.getLeft(thing) - quadrant[this.keyLeft], this.getTop(thing) - quadrant[this.keyTop]);
        }
    };
    /**
     * Draws a Thing's single canvas onto a context, commonly called by
     * this.drawThingOnContext.
     *
     * @param {CanvasRenderingContext2D} context    The context being drawn on.
     * @param {Canvas} canvas   The Thing's canvas being drawn onto the context.
     * @param {Thing} thing   The Thing whose canvas is being drawn.
     * @param {Number} left   The x-position to draw the Thing from.
     * @param {Number} top   The y-position to draw the Thing from.
     */
    PixelDrawr.prototype.drawThingOnContextSingle = function (context, canvas, thing, left, top) {
        // If the sprite should repeat, use the pattern equivalent
        if (thing.repeat) {
            this.drawPatternOnCanvas(context, canvas, left, top, thing.unitwidth, thing.unitheight, thing.opacity || 1);
        }
        else if (thing.opacity !== 1) {
            // Opacities not equal to one must reset the context afterwards
            context.globalAlpha = thing.opacity;
            context.drawImage(canvas, left, top, canvas.width * thing.scale, canvas.height * thing.scale);
            context.globalAlpha = 1;
        }
        else {
            context.drawImage(canvas, left, top, canvas.width * thing.scale, canvas.height * thing.scale);
        }
    };
    /**
     * Draws a Thing's multiple canvases onto a context, typicall called by
     * drawThingOnContext. A variety of cases for canvases is allowed:
     * "vertical", "horizontal", and "corners".
     *
     * @param {CanvasRenderingContext2D} context    The context being drawn on.
     * @param {Canvas} canvases   The canvases being drawn onto the context.
     * @param {Thing} thing   The Thing whose canvas is being drawn.
     * @param {Number} left   The x-position to draw the Thing from.
     * @param {Number} top   The y-position to draw the Thing from.
     */
    PixelDrawr.prototype.drawThingOnContextMultiple = function (context, canvases, thing, left, top) {
        var sprite = thing.sprite, topreal = top, leftreal = left, rightreal = left + thing.unitwidth, bottomreal = top + thing.unitheight, widthreal = thing.unitwidth, heightreal = thing.unitheight, spritewidthpixels = thing.spritewidthpixels, spriteheightpixels = thing.spriteheightpixels, widthdrawn = Math.min(widthreal, spritewidthpixels), heightdrawn = Math.min(heightreal, spriteheightpixels), opacity = thing.opacity, diffhoriz, diffvert, canvasref;
        switch (canvases.direction) {
            case "vertical":
                // If there's a bottom, draw that and push up bottomreal
                if ((canvasref = canvases[this.keyBottom])) {
                    diffvert = sprite.bottomheight ? sprite.bottomheight * this.unitsize : spriteheightpixels;
                    this.drawPatternOnCanvas(context, canvasref.canvas, leftreal, bottomreal - diffvert, widthreal, heightdrawn, opacity);
                    bottomreal -= diffvert;
                    heightreal -= diffvert;
                }
                // If there's a top, draw that and push down topreal
                if ((canvasref = canvases[this.keyTop])) {
                    diffvert = sprite.topheight ? sprite.topheight * this.unitsize : spriteheightpixels;
                    this.drawPatternOnCanvas(context, canvasref.canvas, leftreal, topreal, widthreal, heightdrawn, opacity);
                    topreal += diffvert;
                    heightreal -= diffvert;
                }
                break;
            case "horizontal":
                // If there's a left, draw that and push forward leftreal
                if ((canvasref = canvases[this.keyLeft])) {
                    diffhoriz = sprite.leftwidth ? sprite.leftwidth * this.unitsize : spritewidthpixels;
                    this.drawPatternOnCanvas(context, canvasref.canvas, leftreal, topreal, widthdrawn, heightreal, opacity);
                    leftreal += diffhoriz;
                    widthreal -= diffhoriz;
                }
                // If there's a right, draw that and push back rightreal
                if ((canvasref = canvases[this.keyRight])) {
                    diffhoriz = sprite.rightwidth ? sprite.rightwidth * this.unitsize : spritewidthpixels;
                    this.drawPatternOnCanvas(context, canvasref.canvas, rightreal - diffhoriz, topreal, widthdrawn, heightreal, opacity);
                    rightreal -= diffhoriz;
                    widthreal -= diffhoriz;
                }
                break;
            case "corners":
                // topLeft, left, bottomLeft
                diffvert = sprite.topheight ? sprite.topheight * this.unitsize : spriteheightpixels;
                diffhoriz = sprite.leftwidth ? sprite.leftwidth * this.unitsize : spritewidthpixels;
                this.drawPatternOnCanvas(context, canvases.topLeft.canvas, leftreal, topreal, widthdrawn, heightdrawn, opacity);
                this.drawPatternOnCanvas(context, canvases[this.keyLeft].canvas, leftreal, topreal + diffvert, widthdrawn, heightreal - diffvert * 2, opacity);
                this.drawPatternOnCanvas(context, canvases.bottomLeft.canvas, leftreal, bottomreal - diffvert, widthdrawn, heightdrawn, opacity);
                leftreal += diffhoriz;
                widthreal -= diffhoriz;
                // top, topRight
                diffhoriz = sprite.rightwidth ? sprite.rightwidth * this.unitsize : spritewidthpixels;
                this.drawPatternOnCanvas(context, canvases[this.keyTop].canvas, leftreal, topreal, widthreal - diffhoriz, heightdrawn, opacity);
                this.drawPatternOnCanvas(context, canvases.topRight.canvas, rightreal - diffhoriz, topreal, widthdrawn, heightdrawn, opacity);
                topreal += diffvert;
                heightreal -= diffvert;
                // right, bottomRight, bottom
                diffvert = sprite.bottomheight ? sprite.bottomheight * this.unitsize : spriteheightpixels;
                this.drawPatternOnCanvas(context, canvases[this.keyRight].canvas, rightreal - diffhoriz, topreal, widthdrawn, heightreal - diffvert, opacity);
                this.drawPatternOnCanvas(context, canvases.bottomRight.canvas, rightreal - diffhoriz, bottomreal - diffvert, widthdrawn, heightdrawn, opacity);
                this.drawPatternOnCanvas(context, canvases[this.keyBottom].canvas, leftreal, bottomreal - diffvert, widthreal - diffhoriz, heightdrawn, opacity);
                rightreal -= diffhoriz;
                widthreal -= diffhoriz;
                bottomreal -= diffvert;
                heightreal -= diffvert;
                break;
        }
        // If there's still room, draw the actual canvas
        if ((canvasref = canvases.middle) && topreal < bottomreal && leftreal < rightreal) {
            if (sprite.middleStretch) {
                context.globalAlpha = opacity;
                context.drawImage(canvasref.canvas, leftreal, topreal, widthreal, heightreal);
                context.globalAlpha = 1;
            }
            else {
                this.drawPatternOnCanvas(context, canvasref.canvas, leftreal, topreal, widthreal, heightreal, opacity);
            }
        }
    };
    /* Position utilities (which will almost always become very optimized)
    */
    /**
     * @param {Thing} thing
     * @return {Number} The Thing's top position, accounting for vertical
     *                  offset if needed.
     */
    PixelDrawr.prototype.getTop = function (thing) {
        if (this.keyOffsetY) {
            return thing[this.keyTop] + thing[this.keyOffsetY];
        }
        else {
            return thing[this.keyTop];
        }
    };
    /**
     * @param {Thing} thing
     * @return {Number} The Thing's right position, accounting for horizontal
     *                  offset if needed.
     */
    PixelDrawr.prototype.getRight = function (thing) {
        if (this.keyOffsetX) {
            return thing[this.keyRight] + thing[this.keyOffsetX];
        }
        else {
            return thing[this.keyRight];
        }
    };
    /**
     * @param {Thing} thing
     * @return {Number} The Thing's bottom position, accounting for vertical
     *                  offset if needed.
     */
    PixelDrawr.prototype.getBottom = function (thing) {
        if (this.keyOffsetX) {
            return thing[this.keyBottom] + thing[this.keyOffsetY];
        }
        else {
            return thing[this.keyBottom];
        }
    };
    /**
     * @param {Thing} thing
     * @return {Number} The Thing's left position, accounting for horizontal
     *                  offset if needed.
     */
    PixelDrawr.prototype.getLeft = function (thing) {
        if (this.keyOffsetX) {
            return thing[this.keyLeft] + thing[this.keyOffsetX];
        }
        else {
            return thing[this.keyLeft];
        }
    };
    /* Utilities
    */
    /**
     * Draws a source pattern onto a context. The pattern is clipped to the size
     * of MapScreener.
     *
     * @param {CanvasRenderingContext2D} context   The context the pattern will
     *                                             be drawn onto.
     * @param {Mixed} source   The image being repeated as a pattern. This can
     *                         be a canvas, an image, or similar.
     * @param {Number} left   The x-location to draw from.
     * @param {Number} top   The y-location to draw from.
     * @param {Number} width   How many pixels wide the drawing area should be.
     * @param {Number} left   How many pixels high the drawing area should be.
     * @param {Number} opacity   How transparent the drawing is, in [0,1].
     * @todo Sprites should store patterns so createPattern isn't repeated.
     */
    PixelDrawr.prototype.drawPatternOnCanvas = function (context, source, left, top, width, height, opacity) {
        context.globalAlpha = opacity;
        context.translate(left, top);
        context.fillStyle = context.createPattern(source, "repeat");
        context.fillRect(0, 0, width, height);
        context.translate(-left, -top);
        context.globalAlpha = 1;
    };
    return PixelDrawr;
})();
