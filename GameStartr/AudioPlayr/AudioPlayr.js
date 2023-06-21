var StatsValue = (function () {
    /**
     * Creates a new StatsValue with the given key and settings. Defaults are given
     * to the value via proliferate before the settings.
     *
     * @constructor
     * @param {StatsHoldr} StatsHolder   The container for this value.
     * @param {String} key   The key to reference this new StatsValue by.
     * @param {IStatsValueSettings} settings   Any optional custom settings.
     */
    function StatsValue(StatsHolder, key, settings) {
        this.StatsHolder = StatsHolder;
        StatsHolder.proliferate(this, StatsHolder.getDefaults());
        StatsHolder.proliferate(this, settings);
        this.key = key;
        if (!this.hasOwnProperty("value")) {
            this.value = this.valueDefault;
        }
        if (this.hasElement) {
            this.element = StatsHolder.createElement(settings.element || "div", {
                className: StatsHolder.getPrefix() + "_value " + key
            });
            this.element.appendChild(StatsHolder.createElement("div", {
                "textContent": key
            }));
            this.element.appendChild(StatsHolder.createElement("div", {
                "textContent": this.value
            }));
        }
        if (this.storeLocally) {
            // If there exists an old version of this property, get it 
            if (StatsHolder.getLocalStorage().hasOwnProperty(StatsHolder.getPrefix() + key)) {
                this.value = this.retrieveLocalStorage();
            }
            else {
                // Otherwise save the new version to memory
                this.updateLocalStorage();
            }
        }
    }
    /**
     * General update Function to be run whenever the internal value is changed.
     * It runs all the trigger, modular, etc. checks, updates the HTML element
     * if there is one, and updates localStorage if needed.
     */
    StatsValue.prototype.update = function () {
        // Mins and maxes must be obeyed before any other considerations
        if (this.hasOwnProperty("minimum") && Number(this.value) <= Number(this.minimum)) {
            this.value = this.minimum;
            if (this.onMinimum) {
                this.onMinimum.apply(this, this.callbackArgs);
            }
        }
        else if (this.hasOwnProperty("maximum") && Number(this.value) <= Number(this.maximum)) {
            this.value = this.maximum;
            if (this.onMaximum) {
                this.onMaximum.apply(this, this.callbackArgs);
            }
        }
        if (this.modularity) {
            this.checkModularity();
        }
        if (this.triggers) {
            this.checkTriggers();
        }
        if (this.hasElement) {
            this.updateElement();
        }
        if (this.storeLocally) {
            this.updateLocalStorage();
        }
    };
    /**
     * Checks if the current value should trigger a callback, and if so calls
     * it.
     *
     * @this {StatsValue}
     */
    StatsValue.prototype.checkTriggers = function () {
        if (this.triggers.hasOwnProperty(this.value)) {
            this.triggers[this.value].apply(this, this.callbackArgs);
        }
    };
    /**
     * Checks if the current value is greater than the modularity (assuming
     * modular is a non-zero Numbers), and if so, continuously reduces value and
     * calls this.onModular.
     *
     * @this {StatsValue}
     */
    StatsValue.prototype.checkModularity = function () {
        if (this.value.constructor !== Number || !this.modularity) {
            return;
        }
        while (this.value >= this.modularity) {
            this.value = Math.max(0, this.value - this.modularity);
            if (this.onModular) {
                this.onModular.apply(this, this.callbackArgs);
            }
        }
    };
    /**
     * Updates the StatsValue's element's second child to be the StatsValue's value.
     *
     * @this {StatsValue}
     */
    StatsValue.prototype.updateElement = function () {
        if (this.StatsHolder.hasDisplayChange(this.value)) {
            this.element.children[1].textContent = this.StatsHolder.getDisplayChange(this.value);
        }
        else {
            this.element.children[1].textContent = this.value;
        }
    };
    /**
     * Retrieves a StatsValue's value from localStorage, making sure not to try to
     * JSON.parse an undefined or null value.
     *
     * @return {Mixed}
     */
    StatsValue.prototype.retrieveLocalStorage = function () {
        var value = localStorage.getItem(this.StatsHolder.getPrefix() + this.key);
        switch (value) {
            case "undefined":
                return undefined;
            case "null":
                return null;
        }
        if (value.constructor !== String) {
            return value;
        }
        return JSON.parse(value);
    };
    /**
     * Stores a StatsValue's value in localStorage under the prefix plus its key.
     *
     * @param {Boolean} [overrideAutoSave]   Whether the policy on saving should
     *                                       be ignored (so saving happens
     *                                       regardless). By default, false.
     */
    StatsValue.prototype.updateLocalStorage = function (overrideAutoSave) {
        if (overrideAutoSave === void 0) { overrideAutoSave = false; }
        if (this.StatsHolder.getAutoSave() || overrideAutoSave) {
            this.StatsHolder.getLocalStorage()[this.StatsHolder.getPrefix() + this.key] = JSON.stringify(this.value);
        }
    };
    return StatsValue;
})();
/**
 * StatsHoldr
 * A versatile container to store and manipulate values in localStorage, and
 * optionally keep an updated HTML container showing these values. Operations
 * such as setting, increasing/decreasing, and default values are all abstracted
 * automatically. StatsValues are stored in memory as well as in localStorage for
 * fast lookups.
 * Each StatsHoldr instance requires proliferate and createElement functions
 * (such as those given by the EightBittr prototype).
 *
 * @example
 * // Creating and using a StatsHoldr to store user statistics.
 * var StatsHolder = new StatsHoldr({
 *     "prefix": "MyStatsHoldr",
 *     "values": {
 *         "bestStage": {
 *             "valueDefault": "Beginning",
 *             "storeLocally": true
 *         },
 *         "bestScore": {
 *             "valueDefault": 0,
 *             "storeLocally": true
 *         }
 *     },
 *     "proliferate": EightBittr.prototype.proliferate,
 *     "createElement": EightBittr.prototype.createElement
 * });
 * StatsHolder.set("bestStage", "Middle");
 * StatsHolder.set("bestScore", 9001);
 * console.log(StatsHolder.get("bestStage")); // "Middle"
 * console.log(StatsHolder.get("bestScore")); // "9001"
 * @example
 * // Creating and using a StatsHoldr to show user statistics in HTML elements.
 * var StatsHolder = new StatsHoldr({
 *     "prefix": "MyStatsHoldr",
 *     "doMakeContainer": true,
 *     "containers": [
 *         ["table", {
 *             "id": "StatsOutside",
 *             "style": {
 *                 "textTransform": "uppercase"
 *             }
 *         }],
 *         ["tr", {
 *             "id": "StatsInside"
 *         }]
 *     ],
 *     "defaults": {
 *         "element": "td"
 *     },
 *     "values": {
 *         "bestStage": {
 *             "valueDefault": "Beginning",
 *             "hasElement": true,
 *             "storeLocally": true
 *         },
 *         "bestScore": {
 *             "valueDefault": 0,
 *             "hasElement": true,
 *             "storeLocally": true
 *         }
 *     },
 *     "proliferate": EightBittr.prototype.proliferate,
 *     "createElement": EightBittr.prototype.createElement
 * });
 * document.body.appendChild(StatsHolder.getContainer());
 * StatsHolder.set("bestStage", "Middle");
 * StatsHolder.set("bestScore", 9001);
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var StatsHoldr = (function () {
    /**
     * Resets the StatsHoldr.
     *
     * @constructor
     * @param {String} prefix   A String prefix to prepend to key names in
     *                          localStorage.
     * @param {Function} proliferate   A Function that takes in a recipient
     *                                 Object and a donor Object, and copies
     *                                 attributes over. Generally given by
     *                                 EightBittr.prototype to minimize
     *                                 duplicate code.
     * @param {Function} createElement   A Function to create an Element of a
     *                                   given String type and apply attributes
     *                                   from subsequent Objects. Generally
     *                                   given by EightBittr.prototype to reduce
     *                                   duplicate code.
     * @param {Object} [values]   The keyed values to be stored, as well as all
     *                            associated information with them. The names of
     *                            values are keys in the values Object.
     * @param {Object} [localStorage]   A substitute for localStorage, generally
     *                                  used as a shim (defaults to window's
     *                                  localStorage, or a new Object if that
     *                                  does not exist).
     * @param {Boolean} [autoSave]   Whether this should save changes to
     *                               localStorage automatically (by default,
     *                               false).
     * @param {Boolean} [doMakeContainer]   Whether an HTML container with
     *                                      children for each value should be
     *                                      made (defaults to false).
     * @param {Object} [defaults]   Default attributes for each value.
     * @param {Array} [callbackArgs]   Arguments to pass via Function.apply to
     *                                 triggered callbacks (defaults to []).
     */
    function StatsHoldr(settings) {
        if (settings === void 0) { settings = {}; }
        var key;
        this.prefix = settings.prefix || "";
        this.autoSave = settings.autoSave;
        this.callbackArgs = settings.callbackArgs || [];
        if (settings.localStorage) {
            this.localStorage = settings.localStorage;
        }
        else if (typeof localStorage === "undefined") {
            this.localStorage = {};
        }
        else {
            this.localStorage = localStorage;
        }
        this.defaults = settings.defaults || {};
        this.displayChanges = settings.displayChanges || {};
        this.values = {};
        if (settings.values) {
            for (key in settings.values) {
                if (settings.values.hasOwnProperty(key)) {
                    this.addStatistic(key, settings.values[key]);
                }
            }
        }
        if (settings.doMakeContainer) {
            this.containersArguments = settings.containersArguments || [
                ["div", {
                    "className": this.prefix + "_container"
                }]
            ];
            this.container = this.makeContainer(settings.containersArguments);
        }
    }
    /* Simple gets
    */
    /**
     * @return {Mixed} The values contained within, keyed by their keys.
     */
    StatsHoldr.prototype.getValues = function () {
        return this.values;
    };
    /**
     * @return {Mixed} Default attributes for values.
     */
    StatsHoldr.prototype.getDefaults = function () {
        return this.defaults;
    };
    /**
     * @return {Mixed} A reference to localStorage or a replacment object.
     */
    StatsHoldr.prototype.getLocalStorage = function () {
        return this.localStorage;
    };
    /**
     * @return {Boolean} Whether this should save changes to localStorage
     *                   automatically.
     */
    StatsHoldr.prototype.getAutoSave = function () {
        return this.autoSave;
    };
    /**
     * @return {String} The prefix to store thigns under in localStorage.
     */
    StatsHoldr.prototype.getPrefix = function () {
        return this.prefix;
    };
    /**
     * @return {HTMLElement} The container HTML element, if it exists.
     */
    StatsHoldr.prototype.getContainer = function () {
        return this.container;
    };
    /**
     * @return {Mixed[][]} The createElement arguments for the HTML container
     *                     elements, outside-to-inside.
     */
    StatsHoldr.prototype.getContainersArguments = function () {
        return this.containersArguments;
    };
    /**
     * @return {Mixed} Any hard-coded changes to element content.
     */
    StatsHoldr.prototype.getDisplayChanges = function () {
        return this.displayChanges;
    };
    /**
     * @return {Mixed[]} Arguments to be passed to triggered events.
     */
    StatsHoldr.prototype.getCallbackArgs = function () {
        return this.callbackArgs;
    };
    /* Retrieval
    */
    /**
     * @return {String[]} The names of all value's keys.
     */
    StatsHoldr.prototype.getKeys = function () {
        return Object.keys(this.values);
    };
    /**
     * @param {String} key   The key for a known value.
     * @return {Mixed} The known value of a key, assuming that key exists.
     */
    StatsHoldr.prototype.get = function (key) {
        this.checkExistence(key);
        return this.values[key].value;
    };
    /**
     * @param {String} key   The key for a known value.
     * @return {Object} The settings for that particular key.
     */
    StatsHoldr.prototype.getObject = function (key) {
        return this.values[key];
    };
    /**
     * @param {String} key   The key for a potentially known value.
     * @return {Boolean} Whether there is a value under that key.
     */
    StatsHoldr.prototype.hasKey = function (key) {
        return this.values.hasOwnProperty(key);
    };
    /**
     * @return {Object} The objects being stored.
     */
    StatsHoldr.prototype.getStatsValues = function () {
        return this.values;
    };
    /**
     * @return {Object} A mapping of key names to the actual values of all
     *                  objects being stored.
     */
    StatsHoldr.prototype.export = function () {
        var output = {}, i;
        for (i in this.values) {
            if (this.values.hasOwnProperty(i)) {
                output[i] = this.values[i].value;
            }
        }
        return output;
    };
    /* StatsValues
    */
    /**
     * Adds a new key & value pair to by linking to a newly created StatsValue.
     *
     * @param {String} key   The key to reference by new StatsValue by.
     * @param {Object} settings   The settings for the new StatsValue.
     * @return {StatsValue} The newly created StatsValue.
     */
    StatsHoldr.prototype.addStatistic = function (key, settings) {
        return this.values[key] = new StatsValue(this, key, settings);
    };
    /* Updating values
    */
    /**
     * Sets the value for the StatsValue under the given key, then updates the StatsValue
     * (including the StatsValue's element and localStorage, if needed).
     *
     * @param {String} key   The key of the StatsValue.
     * @param {Mixed} value   The new value for the StatsValue.
     */
    StatsHoldr.prototype.set = function (key, value) {
        this.checkExistence(key);
        this.values[key].value = value;
        this.values[key].update();
    };
    /**
     * Increases the value for the StatsValue under the given key, via addition for
     * Numbers or concatenation for Strings.
     *
     * @param {String} key   The key of the StatsValue.
     * @param {Mixed} [amount]   The amount to increase by (by default, 1).
     */
    StatsHoldr.prototype.increase = function (key, amount) {
        if (amount === void 0) { amount = 1; }
        this.checkExistence(key);
        this.values[key].value += arguments.length > 1 ? amount : 1;
        this.values[key].update();
    };
    /**
     * Increases the value for the StatsValue under the given key, via addition for
     * Numbers or concatenation for Strings.
     *
     * @param {String} key   The key of the StatsValue.
     * @param {Number} [amount]   The amount to increase by (by default, 1).
     */
    StatsHoldr.prototype.decrease = function (key, amount) {
        if (amount === void 0) { amount = 1; }
        this.checkExistence(key);
        this.values[key].value -= amount;
        this.values[key].update();
    };
    /**
     * Toggles whether a value is 1 or 0.
     *
     * @param {String} key   The key of the StatsValue.
     */
    StatsHoldr.prototype.toggle = function (key) {
        this.checkExistence(key);
        this.values[key].value = this.values[key].value ? 0 : 1;
        this.values[key].update();
    };
    /**
     * Ensures a key exists in values, and throws an Error if it doesn't.
     *
     * @param {String} key
     */
    StatsHoldr.prototype.checkExistence = function (key) {
        if (!this.values.hasOwnProperty(key)) {
            throw new Error("Unknown key given to StatsHoldr: '" + key + "'.");
        }
    };
    /**
     * Manually saves all values to localStorage, ignoring the autoSave flag.
     */
    StatsHoldr.prototype.saveAll = function () {
        for (var key in this.values) {
            if (this.values.hasOwnProperty(key)) {
                this.values[key].updateLocalStorage(true);
            }
        }
    };
    /* HTML helpers
    */
    /**
     * Hides the container Element by setting its visibility to hidden.
     */
    StatsHoldr.prototype.hideContainer = function () {
        this.container.style.visibility = "hidden";
    };
    /**
     * Shows the container Element by setting its visibility to visible.
     */
    StatsHoldr.prototype.displayContainer = function () {
        this.container.style.visibility = "visible";
    };
    /**
     * Creates the container Element, which contains a child for each StatsValue that
     * specifies hasElement to be true.
     *
     * @param {Mixed[][]} containers   An Array representing the Element to be
     *                                 created and the children between it and
     *                                 the contained StatsValues. Each contained
     *                                 Mixed[]  has a String tag name as its
     *                                 first member, followed by any number of
     *                                 Objects to apply via createElement.
     * @return {HTMLElement}
     */
    StatsHoldr.prototype.makeContainer = function (containers) {
        var output = this.createElement.apply(this, containers[0]), current = output, child, key, i;
        for (i = 1; i < containers.length; ++i) {
            child = this.createElement.apply(this, containers[i]);
            current.appendChild(child);
            current = child;
        }
        for (key in this.values) {
            if (this.values[key].hasElement) {
                child.appendChild(this.values[key].element);
            }
        }
        return output;
    };
    /**
     * @return {Boolean} Whether displayChanges has an entry for a particular
     *                   value.
     */
    StatsHoldr.prototype.hasDisplayChange = function (value) {
        return this.displayChanges.hasOwnProperty(value);
    };
    /**
     * @return {String} The displayChanges entry for a particular value.
     */
    StatsHoldr.prototype.getDisplayChange = function (value) {
        return this.displayChanges[value];
    };
    /* Utilities
    */
    StatsHoldr.prototype.createElement = function (tag) {
        if (tag === void 0) { tag = undefined; }
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var element = document.createElement(tag), i;
        for (i = 0; i < args.length; i += 1) {
            this.proliferate(element, args[i]);
        }
        return element;
    };
    StatsHoldr.prototype.proliferate = function (recipient, donor, noOverride) {
        if (noOverride === void 0) { noOverride = false; }
        var setting, i;
        for (i in donor) {
            if (donor.hasOwnProperty(i)) {
                // If noOverride, don't override already existing properties
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
        }
        return recipient;
    };
    return StatsHoldr;
})();
/// <reference path="External/StatsHoldr.ts" />
/**
 * AudioPlayr
 * An audio library to automate preloading and controlled playback of multiple
 * audio tracks, with support for different browsers' preferred file types.
 * Volume and mute status are stored locally using a StatsHoldr, which in turn
 * requires proliferate and createElement functions (such as those given by the
 * EightBittr prototype).
 * @example
 * // Creating and using an AudioPlayr to load and play audio files. The
 * // 'Sounds/Samples/mp3' directory should have Coin.mp3 and Bump.mp3 in it.
 * var AudioPlayer = new AudioPlayr({
 *     "directory": "Sounds",
 *     "fileTypes": ["mp3"],
 *     "statistics": {
 *         "prefix": "MyAudioPlayr",
 *         "proliferate": EightBittr.prototype.proliferate,
 *         "createElement": EightBittr.prototype.createElement,
 *         "values": {
 *             "volume": {
 *                 "valueDefault": 0.5,
 *                 "storeLocally": true
 *             },
 *             "muted": {
 *                 "valueDefault": 0,
 *                 "storeLocally": false
 *             }
 *         }
 *     },
 *     "library": {
 *         "Sounds": [
 *             "Coin",
 *             "Bump"
 *         ]
 *     }
 * });
 * AudioPlayer.play("Coin"); // Returns an <audio> playing Coin.mp3
 * @example
 * // Creating and using an AudioPlayr to load and play audio files. A theme
 * // track is kept looping in the background, and the Coin sound is played
 * // every seven seconds.
 * var AudioPlayer = new AudioPlayr({
 *     "directory": "Sounds",
 *     "fileTypes": ["mp3"],
 *     "statistics": {
 *         "prefix": "MyAudioPlayr",
 *         "proliferate": EightBittr.prototype.proliferate,
 *         "createElement": EightBittr.prototype.createElement,
 *         "values": {
 *             "volume": {
 *                 "valueDefault": 0.5,
 *                 "storeLocally": true
 *             },
 *             "muted": {
 *                 "valueDefault": 0,
 *                 "storeLocally": false
 *             }
 *         }
 *     },
 *     "library": {
 *         "Sounds": [
 *             "Coin"
 *         ],
 *         "Themes": [
 *             "Overworld"
 *         ]
 *     }
 * });
 * AudioPlayer.playTheme("Overworld");
 * setInterval(function () {
 *     AudioPlayer.play("Coin");
 * }, 7000);
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var AudioPlayr = (function () {
    /**
     * Resets the AudioPlayr.
     *
     * @param {IAudioPlayrSettings} settings
     */
    function AudioPlayr(settings) {
        if (typeof settings.library === "undefined") {
            throw new Error("No library given to AudioPlayr.");
        }
        if (typeof settings.directory === "undefined") {
            throw new Error("No directory given to AudioPlayr.");
        }
        if (typeof settings.fileTypes === "undefined") {
            throw new Error("No fileTypes given to AudioPlayr.");
        }
        if (!settings.statistics || !settings.statistics.values) {
            throw new Error("No statistics with values given to AudioPlayr.");
        }
        if (!settings.statistics.values.volume || !settings.statistics.values.muted) {
            throw new Error("Statistics given to AudioPlayr must include volume and muted.");
        }
        this.library = settings.library;
        this.directory = settings.directory;
        this.fileTypes = settings.fileTypes;
        this.getThemeDefault = settings.getThemeDefault || "Theme";
        this.getVolumeLocal = typeof settings.getVolumeLocal === "undefined" ? 1 : settings.getVolumeLocal;
        // Sounds should always start blank
        this.sounds = {};
        // Preload everything!
        this.libraryLoad();
        this.StatsHolder = new StatsHoldr(settings.statistics);
        this.setVolume(this.StatsHolder.get("volume"));
        this.setMuted(this.StatsHolder.get("muted"));
    }
    /* Simple getters
    */
    /**
     * @return {Object} The listing of <audio> Elements, keyed by name.
     */
    AudioPlayr.prototype.getLibrary = function () {
        return this.library;
    };
    /**
     * @return {String[]} The allowed filetypes for audio files.
     */
    AudioPlayr.prototype.getfileTypes = function () {
        return this.fileTypes;
    };
    /**
     * @return {Object} The currently playing <audio> Elements, keyed by name.
     */
    AudioPlayr.prototype.getSounds = function () {
        return this.sounds;
    };
    /**
     * @return {HTMLAudioElement} The current playing theme's <audio> Element.
     */
    AudioPlayr.prototype.getTheme = function () {
        return this.theme;
    };
    /**
     * @return {String} The directory under which all filetype directories are
     *                  to be located.
     */
    AudioPlayr.prototype.getDirectory = function () {
        return this.directory;
    };
    /* Playback modifiers
    */
    /**
     * @return {Number} The current volume, which is a Number in [0,1],
     *                  retrieved by the StatsHoldr.
     */
    AudioPlayr.prototype.getVolume = function () {
        return this.StatsHolder.get("volume");
    };
    /**
     * Sets the current volume. If not muted, all sounds will have their volume
     * updated.
     *
     * @param {Number} volume   A Number in [0,1] to set as the current volume.
     */
    AudioPlayr.prototype.setVolume = function (volume) {
        var i;
        if (!this.getMuted()) {
            for (i in this.sounds) {
                if (this.sounds.hasOwnProperty(i)) {
                    this.sounds[i].volume = this.sounds[i].volumeReal * volume;
                }
            }
        }
        this.StatsHolder.set("volume", volume);
    };
    /**
     * @return {Boolean} whether this is currently muted.
     */
    AudioPlayr.prototype.getMuted = function () {
        return Boolean(this.StatsHolder.get("muted"));
    };
    /**
     * Calls either setMutedOn or setMutedOff as is appropriate.
     *
     * @param {Boolean} muted   The new status for muted.
     */
    AudioPlayr.prototype.setMuted = function (muted) {
        this.getMuted() ? this.setMutedOn() : this.setMutedOff();
    };
    /**
     * Calls either setMutedOn or setMutedOff to toggle whether this is muted.
     */
    AudioPlayr.prototype.toggleMuted = function () {
        this.setMuted(!this.getMuted());
    };
    /**
     * Sets volume to 0 in all currently playing sounds and stores the muted
     * status as on in the internal StatsHoldr.
     */
    AudioPlayr.prototype.setMutedOn = function () {
        for (var i in this.sounds) {
            if (this.sounds.hasOwnProperty(i)) {
                this.sounds[i].volume = 0;
            }
        }
        this.StatsHolder.set("muted", 1);
    };
    /**
     * Sets sound volumes to their actual volumes and stores the muted status
     * as off in the internal StatsHoldr.
     */
    AudioPlayr.prototype.setMutedOff = function () {
        var volume = this.getVolume(), sound, i;
        for (i in this.sounds) {
            if (this.sounds.hasOwnProperty(i)) {
                sound = this.sounds[i];
                sound.volume = Number(sound.getAttribute("volumeReal")) * volume;
            }
        }
        this.StatsHolder.set("muted", 0);
    };
    /* Other modifiers
    */
    /**
     * @return {Mixed} The Function or Number used as the volume setter for
     *                 "local" sounds.
     */
    AudioPlayr.prototype.getGetVolumeLocal = function () {
        return this.getVolumeLocal;
    };
    /**
     * @param {Mixed} getVolumeLocal   A new Function or Number to use as the
     *                                 volume setter for "local" sounds.
     */
    AudioPlayr.prototype.setGetVolumeLocal = function (getVolumeLocalNew) {
        this.getVolumeLocal = getVolumeLocalNew;
    };
    /**
     * @return {Mixed} The Function or String used to get the default theme for
     *                 playTheme calls.
     */
    AudioPlayr.prototype.getGetThemeDefault = function () {
        return this.getThemeDefault;
    };
    /**
     * @param {Mixed} A new Function or String to use as the source for theme
     *                names in default playTheme calls.
     */
    AudioPlayr.prototype.setGetThemeDefault = function (getThemeDefaultNew) {
        this.getThemeDefault = getThemeDefaultNew;
    };
    /* Playback
    */
    /**
     * @param {String} name   The name of the sound to play.
     *
     * Plays the sound of the given name. Internally, this stops any previously
     * playing sound of that name and starts a new one, with volume set to the
     * current volume and muted status. If the name wasn't previously being
     * played (and therefore a new Element has been created), an event listener
     * is added to delete it from sounds after.
     *
     * @return {HTMLAudioElement} The sound's <audio> element, now playing.
     */
    AudioPlayr.prototype.play = function (name) {
        var sound, used;
        // If the sound isn't yet being played, see if it's in the library
        if (!this.sounds.hasOwnProperty(name)) {
            // If the sound also isn't in the library, it's unknown
            if (!this.library.hasOwnProperty(name)) {
                throw new Error("Unknown name given to AudioPlayr.play: '" + name + "'.");
            }
            sound = this.sounds[name] = this.library[name];
        }
        else {
            sound = this.sounds[name];
        }
        this.soundStop(sound);
        if (this.getMuted()) {
            sound.volume = 0;
        }
        else {
            sound.setAttribute("volumeReal", "1");
            sound.volume = this.getVolume();
        }
        this.playSound(sound);
        used = Number(sound.getAttribute("used"));
        // If this is the song's first play, let it know how to stop
        if (!used) {
            sound.setAttribute("used", String(used + 1));
            sound.addEventListener("ended", this.soundFinish.bind(this, name));
        }
        sound.setAttribute("name", name);
        return sound;
    };
    /**
     * Pauses all currently playing sounds.
     */
    AudioPlayr.prototype.pauseAll = function () {
        for (var i in this.sounds) {
            if (this.sounds.hasOwnProperty(i)) {
                this.sounds[i].pause();
            }
        }
    };
    /**
     * Un-pauses (resumes) all currently paused sounds.
     */
    AudioPlayr.prototype.resumeAll = function () {
        for (var i in this.sounds) {
            if (!this.sounds.hasOwnProperty(i)) {
                continue;
            }
            this.sounds[i].play();
        }
    };
    /**
     * Pauses the currently playing theme, if there is one.
     */
    AudioPlayr.prototype.pauseTheme = function () {
        if (this.theme) {
            this.theme.pause();
        }
    };
    /**
     * Resumes the theme, if there is one and it's paused.
     */
    AudioPlayr.prototype.resumeTheme = function () {
        if (this.theme) {
            this.theme.play();
        }
    };
    /**
     * Stops all sounds and any theme, and removes all references to them.
     */
    AudioPlayr.prototype.clearAll = function () {
        this.pauseAll();
        this.clearTheme();
        this.sounds = {};
    };
    /**
     * Pauses and removes the theme, if there is one.
     */
    AudioPlayr.prototype.clearTheme = function () {
        if (!this.theme) {
            return;
        }
        this.pauseTheme();
        delete this.sounds[this.theme.getAttribute("name")];
        this.theme = undefined;
    };
    /**
     * "Local" version of play that changes the output sound's volume depending
     * on the result of a getVolumeLocal call. This defaults to 1, but may be
     * less. For example, in a video game, sounds further from the viewpoint
     * should have lessened volume.
     *
     * @param {String} name   The name of the sound to play.
     * @param {Mixed} [location]   An argument for getVolumeLocal, if that's a
     *                             Function.
     * @return {HTMLAudioElement} The sound's <audio> element, now playing.
     */
    AudioPlayr.prototype.playLocal = function (name, location) {
        if (location === void 0) { location = undefined; }
        var sound = this.play(name), volumeReal;
        switch (this.getVolumeLocal.constructor) {
            case Function:
                volumeReal = this.getVolumeLocal(location);
                break;
            case Number:
                volumeReal = this.getVolumeLocal;
                break;
            default:
                volumeReal = Number(this.getVolumeLocal) || 1;
                break;
        }
        sound.setAttribute("volumeReal", String(volumeReal));
        if (this.getMuted()) {
            sound.volume = 0;
        }
        else {
            sound.volume = volumeReal * this.getVolume();
        }
        return sound;
    };
    /**
     * Pauses any previously playing theme and starts playback of a new theme
     * sound. This is different from normal sounds in that it normally loops and
     * is controlled by pauseTheme and co. If loop is on and the sound wasn't
     * already playing, an event listener is added for when it ends.
     *
     * @param {String} [name]   The name of the sound to be used as the theme.
     *                          If not provided, getThemeDefault is used to
     *                          provide one.
     * @param {Boolean} [loop]   Whether the theme should always loop (by
     *                           default, true).
     * @return {HTMLAudioElement} The theme's <audio> element, now playing.
     */
    AudioPlayr.prototype.playTheme = function (name, loop) {
        if (name === void 0) { name = undefined; }
        if (loop === void 0) { loop = undefined; }
        this.pauseTheme();
        // Loop defaults to true
        loop = typeof loop !== "undefined" ? loop : true;
        // If name isn't given, use the default getter
        if (typeof (name) === "undefined") {
            switch (this.getThemeDefault.constructor) {
                case Function:
                    name = this.getThemeDefault();
                    break;
                case String:
                    name = this.getThemeDefault;
                    break;
            }
        }
        // If a theme already exists, kill it
        if (typeof this.theme !== "undefined" && this.theme.hasAttribute("name")) {
            delete this.sounds[this.theme.getAttribute("name")];
        }
        this.theme = this.sounds[name] = this.play(name);
        this.theme.loop = loop;
        // If it's used (no repeat), add the event listener to resume theme
        if (this.theme.used === 1) {
            this.theme.addEventListener("ended", this.playTheme);
        }
        return this.theme;
    };
    /**
     * Wrapper around playTheme that plays a sound, then a theme. This is
     * implemented using an event listener on the sound's ending.
     *
     * @param {String} [prefix]    A prefix for the sound? Not sure...
     * @param {String} [name]   The name of the sound to be used as the theme.
     *                          If not provided, getThemeDefault is used to
     *                          provide one.
     * @param {Boolean} [loop]   Whether the theme should always loop (by
     *                           default, false).
     * @return {HTMLAudioElement} The sound's <audio> element, now playing.
     */
    AudioPlayr.prototype.playThemePrefixed = function (prefix, name, loop) {
        if (prefix === void 0) { prefix = undefined; }
        if (name === void 0) { name = undefined; }
        if (loop === void 0) { loop = undefined; }
        var sound = this.play(prefix);
        this.pauseTheme();
        // If name isn't given, use the default getter
        if (typeof (name) === "undefined") {
            switch (this.getThemeDefault.constructor) {
                case Function:
                    name = this.getThemeDefault();
                    break;
                case String:
                    name = this.getThemeDefault;
                    break;
            }
        }
        this.addEventListener(prefix, "ended", this.playTheme.bind(self, prefix + " " + name, loop));
        return sound;
    };
    /* Public utilities
    */
    /**
     * Adds an event listener to a currently playing sound. The sound will keep
     * track of event listeners via an .addedEvents attribute, so they can be
     * cancelled later.
     *
     * @param {String} name   The name of the sound.
     * @param {String} event   The name of the event, such as "ended".
     * @param {Function} callback   The Function to be called by the event.
     */
    AudioPlayr.prototype.addEventListener = function (name, event, callback) {
        var sound = this.library[name];
        if (!sound) {
            throw new Error("Unknown name given to addEventListener: '" + name + "'.");
        }
        if (!sound.addedEvents) {
            sound.addedEvents = {};
        }
        if (!sound.addedEvents[event]) {
            sound.addedEvents[event] = [callback];
        }
        else {
            sound.addedEvents[event].push(callback);
        }
        sound.addEventListener(event, callback);
    };
    /**
     * Clears all events added by this.addEventListener to a sound under a given
     * event.
     *
     * @param {String} name   The name of the sound.
     * @param {String} event   The name of the event, such as "ended".
     */
    AudioPlayr.prototype.removeEventListeners = function (name, event) {
        var sound = this.library[name], events, i;
        if (!sound) {
            throw new Error("Unknown name given to removeEventListeners: '" + name + "'.");
        }
        if (!sound.addedEvents) {
            return;
        }
        events = sound.addedEvents[event];
        if (!events) {
            return;
        }
        for (i = 0; i < events.length; i += 1) {
            sound.removeEventListener(event, events[i]);
        }
        events.length = 0;
    };
    /**
     * Adds an event listener to a sound. If the sound doesn't exist or has
     * finished playing, it's called immediately.
     *
     * @param {String} name   The name of the sound.
     * @param {String} event   The name of the event, such as "onended".
     * @param {Function} callback   The Function to be called by the event.
     */
    AudioPlayr.prototype.addEventImmediate = function (name, event, callback) {
        if (!this.sounds.hasOwnProperty(name) || this.sounds[name].paused) {
            callback();
            return;
        }
        this.sounds[name].addEventListener(event, callback);
    };
    /* Private utilities
    */
    /**
     * Called when a sound has completed to get it out of sounds.
     *
     * @param {String} name   The name of the sound that just finished.
     */
    AudioPlayr.prototype.soundFinish = function (name) {
        if (this.sounds.hasOwnProperty(name)) {
            delete this.sounds[name];
        }
    };
    /**
     * Carefully stops a sound. HTMLAudioElement don't natively have a .stop()
     * function, so this is the shim to do that.
     */
    AudioPlayr.prototype.soundStop = function (sound) {
        sound.pause();
        if (sound.readyState) {
            sound.currentTime = 0;
        }
    };
    /* Private loading / resetting
    */
    /**
     * Loads every sound defined in the library via AJAX. Sounds are loaded
     * into <audio> elements via createAudio and stored in the library.
     */
    AudioPlayr.prototype.libraryLoad = function () {
        var section, name, sectionName, j;
        for (sectionName in this.library) {
            if (!this.library.hasOwnProperty(sectionName)) {
                continue;
            }
            section = this.library[sectionName];
            for (j in section) {
                if (!section.hasOwnProperty(j)) {
                    continue;
                }
                name = section[j];
                // Create the sound and store it in the container
                this.library[name] = this.createAudio(name, sectionName);
            }
        }
    };
    /**
     * Creates an audio element, gives it sources, and starts preloading.
     *
     * @param {String} name
     * @param {String} sectionName
     * @return {HTMLAudioElement}
     */
    AudioPlayr.prototype.createAudio = function (name, sectionName) {
        var sound = document.createElement("audio"), sourceType, child, i;
        for (i = 0; i < this.fileTypes.length; i += 1) {
            sourceType = this.fileTypes[i];
            child = document.createElement("source");
            child.type = "audio/" + sourceType;
            child.src = this.directory + "/" + sectionName + "/" + sourceType + "/" + name + "." + sourceType;
            sound.appendChild(child);
        }
        // This preloads the sound.
        sound.volume = 0;
        sound.setAttribute("volumeReal", "1");
        sound.setAttribute("used", "0");
        this.playSound(sound);
        return sound;
    };
    /**
     * Utility to try to play a sound, which may not be possible in headless
     * environments like PhantomJS.
     *
     * @param {HTMLAudioElement} sound
     * @return {Boolean} Whether the sound was able to play.
     */
    AudioPlayr.prototype.playSound = function (sound) {
        if (sound && sound.play) {
            sound.play();
            return true;
        }
        return false;
    };
    return AudioPlayr;
})();
