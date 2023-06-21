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
/// <reference path="MapsCreatrObjects.d.ts" />
/**
 * Basic storage container for a single Thing to be stored in an Area's
 * PreThings member. A PreThing stores an actual Thing along with basic
 * sizing and positioning information, so that a MapsHandler may accurately
 * spawn or unspawn it as needed.
 */
var PreThing = (function () {
    /**
     * @param {Thing} thing   The Thing, freshly created by ObjectMaker.make.
     * @param {PreThingSettings} reference   The creation Object instruction
     *                                        used to create the Thing.
     */
    function PreThing(thing, reference, ObjectMaker) {
        this.thing = thing;
        this.title = thing.title;
        this.reference = reference;
        this.spawned = false;
        this.left = reference.x || 0;
        this.top = reference.y || 0;
        this.right = this.left + (reference.width || ObjectMaker.getFullPropertiesOf(this.title).width);
        this.bottom = this.top + (reference.height || ObjectMaker.getFullPropertiesOf(this.title).height);
        if (reference.position) {
            this.position = reference.position;
        }
    }
    return PreThing;
})();
/**
 * MapsCreatr.js
 *
 * Storage container and lazy loader for GameStarter maps that is the back-end
 * counterpart to MapsHandlr. Maps are created with their custom Location and
 * Area members, which are initialized the first time the map is retrieved.
 * Areas contain a "creation" Object[] detailing the instructions on creating
 * that Area's "PreThing" objects, which store Things along with basic position
 * information.
 *
 * In short, a Map contains a set of Areas, each of which knows its size and the
 * steps to create its contents. Each Map also contains a set of Locations,
 * which are entry points into one Area each.
 *
 * See Schema.txt for the minimum recommended format for Maps, Locations,
 * Areas, and creation commands.
 *
 * @example
 * // Creating and using a MapsCreatr to store a very simple Map.
 * var MapsCreator = new MapsCreatr({
 *         "ObjectMaker": new ObjectMakr({
 *             "doPropertiesFull": true,
 *             "inheritance": {
 *                 "Map": {},
 *                 "Area": {},
 *                 "Location": {},
 *                 "Thing": {
 *                     "SomeThing": {}
 *                 }
 *             },
 *             "properties": {
 *                 "SomeThing": {
 *                     "title": "SomeThing",
 *                     "groupType": "Thing",
 *                     "width": 7,
 *                     "height": 7
 *                 }
 *             }
 *         }),
 *         "groupTypes": ["Thing"],
 *         "maps": {
 *             "MyFirstMap": {
 *                 "locations": [
 *                     { "area": 0, "entry": "Normal" }
 *                 ],
 *                 "areas": [{
 *                     "creation": [
 *                         { "thing": "SomeThing", "x": 3, "y": 4 }
 *                     ]
 *                 }]
 *             }
 *         }
 *     }),
 *     map = MapsCreator.getMap("MyFirstMap");
 *
 * // Map { locations: Array[1], areas: Array[1], areasRaw: Array[1], ... }
 * console.log(map);
 *
 * // Area { creation: Array[1], map: Map, name: "0", boundaries: Object, ... }
 * console.log(map.areas[0]);
 *
 * // Object { thing: "SomeThing", x: 3, y: 4 }
 * console.log(map.areas[0].creation[0]);
 *
 * @example
 * // Creating and using a MapsCreatr to store a simple Map with a macro and
 * // look at what will be created when it's used.
 * var MapsCreator = new MapsCreatr({
 *         "ObjectMaker": new ObjectMakr({
 *             "doPropertiesFull": true,
 *             "inheritance": {
 *                 "Map": {},
 *                 "Area": {},
 *                 "Location": {},
 *                 "Thing": {
 *                     "SomeThing": {}
 *                 }
 *             },
 *             "properties": {
 *                 "SomeThing": {
 *                     "title": "SomeThing",
 *                     "groupType": "Thing",
 *                     "width": 7,
 *                     "height": 7
 *                 }
 *             }
 *         }),
 *         "groupTypes": ["Thing"],
 *         "macros": {
 *             "Fill": function (reference) {
 *                 var output = [],
 *                     thing = reference.thing,
 *                     between = reference.between || 10,
 *                     times = reference.times || 1,
 *                     x = reference.x || 0,
 *                     y = reference.y || 0;
 *
 *                 while (times > 0) {
 *                     output.push({
 *                         "thing": reference.thing,
 *                         "x": x,
 *                         "y": y
 *                     });
 *                     x += between;
 *                     times -= 1;
 *                 }
 *
 *                 return output;
 *             }
 *         },
 *         "maps": {
 *             "MyFirstMap": {
 *                 "locations": [
 *                     { "area": 0, "entry": "Normal" }
 *                 ],
 *                 "areas": [{
 *                     "creation": [
 *                         { "macro": "Fill", "thing": "SomeThing", "times": 7, "x": 3, "y": 4 }
 *                     ]
 *                 }]
 *             }
 *         }
 *     }),
 *     map = MapsCreator.getMap("MyFirstMap"),
 *     prethings = MapsCreator.getPreThings(map.areas[0]);
 *
 * // Object {Thing: Object}
 * console.log(prethings);
 *
 * // Object { xInc: Array[7], xDec: Array[7], yInc: Array[7], yDec: ... }
 * console.log(prethings.Thing);
 *
 * // [PreThing, PreThing, PreThing, PreThing, PreThing, PreThing, PreThing]
 * console.log(prethings.Thing.xInc);
 *
 * // PreThing { thing: SomeThing, title: "SomeThing", reference: Object, ... }
 * console.log(prethings.Thing.xInc[0]);
 *
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var MapsCreatr = (function () {
    /**
     * Resets the MapsCreatr.
     *
     * @constructor
     * @param {IMapsCreatrSettings} settings
     */
    function MapsCreatr(settings) {
        if (!settings) {
            throw new Error("No settings given to MapsCreatr.");
        }
        // Maps and Things are created using an ObjectMaker factory
        if (!settings.ObjectMaker) {
            throw new Error("No ObjectMakr given to MapsCreatr.");
        }
        this.ObjectMaker = settings.ObjectMaker;
        if (typeof this.ObjectMaker.getFullProperties() === "undefined") {
            throw new Error("MapsCreatr's ObjectMaker must store full properties.");
        }
        // At least one group type name should be defined for PreThing output
        if (!settings.groupTypes) {
            throw new Error("No groupTypes given to MapsCreatr.");
        }
        this.groupTypes = settings.groupTypes;
        this.keyGroupType = settings.keyGroupType || "groupType";
        this.keyEntrance = settings.keyEntrance || "entrance";
        this.macros = settings.macros || {};
        this.scope = settings.scope || this;
        this.entrances = settings.entrances;
        this.requireEntrance = settings.requireEntrance;
        this.maps = {};
        if (settings.maps) {
            this.storeMaps(settings.maps);
        }
    }
    /* Simple gets
    */
    /**
     * @return {ObjectMakr}   The internal ObjectMakr.
     */
    MapsCreatr.prototype.getObjectMaker = function () {
        return this.ObjectMaker;
    };
    /**
     * @return {String[]}   The allowed group types.
     */
    MapsCreatr.prototype.getGroupTypes = function () {
        return this.groupTypes;
    };
    /**
     * @return {String}   The key under which Things are to store their group.
     */
    MapsCreatr.prototype.getKeyGroupType = function () {
        return this.keyGroupType;
    };
    /**
     * @return {String}   The key under which Things declare themselves an entrance.
     */
    MapsCreatr.prototype.getKeyEntrance = function () {
        return this.keyEntrance;
    };
    /**
     * @return {Object}   The allowed macro Functions.
     */
    MapsCreatr.prototype.getMacros = function () {
        return this.macros;
    };
    /**
     * @return {Mixed}   The scope to give as a last parameter to macros.
     */
    MapsCreatr.prototype.getScope = function () {
        return this.scope;
    };
    /**
     * @return {Boolean} Whether Locations must have an entrance Function.
     */
    MapsCreatr.prototype.getRequireEntrance = function () {
        return this.requireEntrance;
    };
    /**
     * @return {Object}   The Object storing maps, keyed by name.
     */
    MapsCreatr.prototype.getMaps = function () {
        return this.maps;
    };
    /**
     * Simple getter for a map under the maps container. If the map has not been
     * initialized (had its areas and locations set), that is done here as lazy
     * loading.
     *
     * @param {Mixed} name   A key to find the map under. This will typically be
     *                       a String.
     * @return {Map}
     */
    MapsCreatr.prototype.getMap = function (name) {
        var map = this.maps[name];
        if (!map) {
            throw new Error("No map found under: " + name);
        }
        if (!map.initialized) {
            // Set the one-to-many Map->Area relationships within the Map
            this.setMapAreas(map);
            // Set the one-to-many Area->Location relationships within the Map
            this.setMapLocations(map);
            map.initialized = true;
        }
        return map;
    };
    /**
     * Creates and stores a set of new maps based on the key/value pairs in a
     * given Object. These will be stored as maps by their string keys via
     * this.storeMap.
     *
     * @param {Object} maps   An Object containing a set of key/map pairs to
     *                       store as maps.
     * @return {Object}   The newly created maps object.
     */
    MapsCreatr.prototype.storeMaps = function (maps) {
        for (var i in maps) {
            if (maps.hasOwnProperty(i)) {
                this.storeMap(i, maps[i]);
            }
        }
    };
    /**
     * Creates and stores a new map. The internal ObjectMaker factory is used to
     * auto-generate it based on a given settings object. The actual loading of
     * Areas and Locations is deferred to this.getMap.
     *
     * @param {Mixed} name   A name under which the map should be stored,
     *                       commonly a String or Array.
     * @param {Object} settings   An Object containing arguments to be sent to
     *                            the ObjectMakr being used as a Maps factory.
     * @return {Map}   The newly created Map.
     */
    MapsCreatr.prototype.storeMap = function (name, settings) {
        if (!name) {
            throw new Error("Maps cannot be created with no name.");
        }
        var map = this.ObjectMaker.make("Map", settings);
        if (!map.areas) {
            throw new Error("Maps cannot be used with no areas: " + name);
        }
        if (!map.locations) {
            throw new Error("Maps cannot be used with no locations: " + name);
        }
        this.maps[name] = map;
        return map;
    };
    /* Area setup (PreThing analysis)
    */
    /**
     * Given a Area, this processes and returns the PreThings that are to
     * inhabit the Area per its creation instructions.
     *
     * Each reference (which is a JSON object taken from an Area's .creation
     * Array) is an instruction to this script to switch to a location, push
     * some number of PreThings to the PreThings object via a predefined macro,
     * or push a single PreThing to the PreThings object.
     *
     * Once those PreThing objects are obtained, they are filtered for validity
     * (e.g. location setter commands are irrelevant after a single use), and
     * sorted on .xloc and .yloc.
     *
     * @param {Area} area
     * @return {Object}   An associative array of PreThing containers. The keys
     *                    will be the unique group types of all the allowed
     *                    Thing groups, which will be stored in the parent
     *                    EightBittr's GroupHoldr. Each container stores Arrays
     *                    of the PreThings sorted by .xloc and .yloc in both
     *                    increasing and decreasing order.
     */
    MapsCreatr.prototype.getPreThings = function (area) {
        var map = area.map, creation = area.creation, prethings = this.fromKeys(this.groupTypes), i;
        this.xloc = 0;
        this.yloc = 0;
        area.collections = {};
        for (i = 0; i < creation.length; i += 1) {
            this.analyzePreSwitch(creation[i], prethings, area, map);
        }
        return this.processPreThingsArrays(prethings);
    };
    /**
     * PreThing switcher: Given a JSON representation of a PreThing, this
     * determines what to do with it. It may be a location setter (to switch the
     * x- and y- location offset), a macro (to repeat some number of actions),
     * or a raw PreThing.
     * Any modifications done in a called function will be to push some number
     * of PreThings to their respective group in the output PreThings Object.
     *
     * @param {Object} reference   A JSON mapping of some number of PreThings.
     * @param {Object} PreThings   An associative array of PreThing Arrays,
     *                             keyed by the allowed group types.
     * @param {Area} area   The Area object to be populated by these PreThings.
     * @param {Map} map   The Map object containing the Area object.
     */
    MapsCreatr.prototype.analyzePreSwitch = function (reference, prethings, area, map) {
        // Case: macro (unless it's undefined)
        if (reference.macro) {
            return this.analyzePreMacro(reference, prethings, area, map);
        }
        else {
            // Case: default (a regular PreThing)
            return this.analyzePreThing(reference, prethings, area, map);
        }
    };
    /**
     * PreThing case: Macro instruction. This calls the macro on the same input,
     * captures the output, and recursively repeats the analyzePreSwitch driver
     * function on the output(s).
     *
     * @param {Object} reference   A JSON mapping of some number of PreThings.
     * @param {Object} PreThings   An associative array of PreThing Arrays,
     *                             keyed by the allowed group types.
     * @param {Area} area   The Area object to be populated by these PreThings.
     * @param {Map} map   The Map object containing the Area object.
     */
    MapsCreatr.prototype.analyzePreMacro = function (reference, prethings, area, map) {
        var macro = this.macros[reference.macro], outputs, i;
        if (!macro) {
            console.warn("A non-existent macro is referenced. It will be ignored:", macro, reference, prethings, area, map);
            return;
        }
        // Avoid modifying the original macro by creating a new object in its
        // place, while submissively proliferating any default macro settings
        outputs = macro(reference, prethings, area, map, this.scope);
        // If there is any output, recurse on all components of it, Array or not
        if (outputs) {
            if (outputs instanceof Array) {
                for (i = 0; i < outputs.length; i += 1) {
                    this.analyzePreSwitch(outputs[i], prethings, area, map);
                }
            }
            else {
                this.analyzePreSwitch(outputs, prethings, area, map);
            }
        }
        return outputs;
    };
    /**
     * Macro case: PreThing instruction. This creates a PreThing from the
     * given reference and adds it to its respective group in PreThings (based
     * on the PreThing's [keyGroupType] variable).
     *
     * @param {Object} reference   A JSON mapping of some number of PreThings.
     * @param {Object} PreThings   An associative array of PreThing Arrays,
     *                             keyed by the allowed group types.
     * @param {Area} area   The Area object to be populated by these PreThings.
     * @param {Map} map   The Map object containing the Area object.
     */
    MapsCreatr.prototype.analyzePreThing = function (reference, prethings, area, map) {
        var title = reference.thing, thing, prething;
        if (!this.ObjectMaker.hasFunction(title)) {
            console.warn("A non-existent Thing type is referenced. It will be ignored:", title, reference, prethings, area, map);
            return;
        }
        prething = new PreThing(this.ObjectMaker.make(title, reference), reference, this.ObjectMaker);
        thing = prething.thing;
        if (!prething.thing[this.keyGroupType]) {
            console.warn("A Thing does not contain a " + this.keyGroupType + ". It will be ignored:", prething, "\n", arguments);
            return;
        }
        if (this.groupTypes.indexOf(prething.thing[this.keyGroupType]) === -1) {
            console.warn("A Thing contains an unknown " + this.keyGroupType + ". It will be ignored:", thing[this.keyGroupType], prething, reference, prethings, area, map);
            return;
        }
        prethings[prething.thing[this.keyGroupType]].push(prething);
        if (!thing.noBoundaryStretch && area.boundaries) {
            this.stretchAreaBoundaries(prething, area);
        }
        // If a Thing is an entrance, then the location it is an entrance to 
        // must know it and its position. Note that this will have to be changed
        // for Pokemon/Zelda style games.
        if (thing[this.keyEntrance] !== undefined && typeof thing[this.keyEntrance] !== "object") {
            if (typeof map.locations[thing[this.keyEntrance]] !== "undefined") {
                if (typeof map.locations[thing[this.keyEntrance]].xloc === "undefined") {
                    map.locations[thing[this.keyEntrance]].xloc = prething.left;
                }
                if (typeof map.locations[thing[this.keyEntrance]].yloc === "undefined") {
                    map.locations[thing[this.keyEntrance]].yloc = prething.top;
                }
                map.locations[thing[this.keyEntrance]].entrance = prething.thing;
            }
        }
        if (reference.collectionName && area.collections) {
            this.ensureThingCollection(prething, reference.collectionName, reference.collectionKey, area);
        }
        return prething;
    };
    /**
     * Converts the raw area settings in a Map into Area objects.
     *
     * These areas are typically stored as an Array or Object inside the Map
     * containing some number of attribute keys (such as "settings") along with
     * an Array under "Creation" that stores some number of commands for
     * populating that area in MapsHandlr::spawnMap.
     *
     * @param {Map} map
     */
    MapsCreatr.prototype.setMapAreas = function (map) {
        var areasRaw = map.areas, locationsRaw = map.locations, 
        // The parsed containers should be the same types as the originals
        areasParsed = new areasRaw.constructor(), locationsParsed = new locationsRaw.constructor(), area, location, i;
        for (i in areasRaw) {
            if (areasRaw.hasOwnProperty(i)) {
                area = this.ObjectMaker.make("Area", areasRaw[i]);
                areasParsed[i] = area;
                area.map = map;
                area.name = i;
                area.boundaries = {
                    "top": 0,
                    "right": 0,
                    "bottom": 0,
                    "left": 0
                };
            }
        }
        for (i in locationsRaw) {
            if (locationsRaw.hasOwnProperty(i)) {
                location = this.ObjectMaker.make("Location", locationsRaw[i]);
                locationsParsed[i] = location;
                location.entryRaw = locationsRaw[i].entry;
                location.name = i;
                location.area = locationsRaw[i].area || 0;
                if (this.requireEntrance) {
                    if (!this.entrances.hasOwnProperty(location.entryRaw)) {
                        throw new Error("Location " + i + " has unknown entry string: " + location.entryRaw);
                    }
                }
                if (this.entrances && location.entryRaw) {
                    location.entry = this.entrances[location.entryRaw];
                }
                else if (location.entry && location.entry.constructor === String) {
                    location.entry = this.entrances[String(location.entry)];
                }
            }
        }
        // Store the output object in the Map, and keep the raw settings for the
        // sake of debugging / user interest
        map.areas = areasParsed;
        map.areasRaw = areasRaw;
        map.locations = locationsParsed;
        map.locationsRaw = locationsRaw;
    };
    /**
     * Converts the raw location settings in a Map into Location objects.
     *
     * These locations typically have very little information, generally just a
     * container Area, x-location, y-location, and spawning function.
     *
     * @param {Map} map
     */
    MapsCreatr.prototype.setMapLocations = function (map) {
        var locsRaw = map.locations, 
        // The parsed container should be the same type as the original
        locsParsed = new locsRaw.constructor(), location, i;
        for (i in locsRaw) {
            if (locsRaw.hasOwnProperty(i)) {
                location = this.ObjectMaker.make("Location", locsRaw[i]);
                locsParsed[i] = location;
                // The area should be an object reference, under the Map's areas
                location.area = map.areas[locsRaw[i].area || 0];
                if (!locsParsed[i].area) {
                    throw new Error("Location " + i + " references an invalid area:" + locsRaw[i].area);
                }
            }
        }
        // Store the output object in the Map, and keep the old settings for the
        // sake of debugging / user interest
        map.locations = locsParsed;
        map.locationsRaw = locsRaw;
    };
    /**
     * "Stretches" an Area's boundaries based on a PreThing. For each direction,
     * if the PreThing has a more extreme version of it (higher top, etc.), the
     * boundary is updated.
     *
     * @param {PreThing} prething
     * @param {Area} area
     */
    MapsCreatr.prototype.stretchAreaBoundaries = function (prething, area) {
        var boundaries = area.boundaries;
        boundaries.top = Math.min(prething.top, boundaries.top);
        boundaries.right = Math.max(prething.right, boundaries.right);
        boundaries.bottom = Math.max(prething.bottom, boundaries.bottom);
        boundaries.left = Math.min(prething.left, boundaries.left);
    };
    /**
     * Adds a Thing to the specified collection in the Map's Area.
     *
     * @param {PreThing} prething
     * @param {String} collectionName
     * @param {String} collectionKey
     * @param {Area} area
     */
    MapsCreatr.prototype.ensureThingCollection = function (prething, collectionName, collectionKey, area) {
        var thing = prething.thing, collection = area.collections[collectionName];
        if (!collection) {
            collection = area.collections[collectionName] = {};
        }
        thing.collection = collection;
        collection[collectionKey] = thing;
    };
    /**
     * Creates an Object wrapper around a PreThings Object with versions of
     * each child PreThing[]sorted by xloc and yloc, in increasing and
     * decreasing order.
     *
     * @param {Object} prethings
     * @return {Object} A PreThing wrapper with the keys "xInc", "xDec",
     *                  "yInc", and "yDec".
     */
    MapsCreatr.prototype.processPreThingsArrays = function (prethings) {
        var scope = this, output = {}, i;
        for (i in prethings) {
            if (prethings.hasOwnProperty(i)) {
                var children = prethings[i], array = {
                    "xInc": this.getArraySorted(children, this.sortPreThingsXInc),
                    "xDec": this.getArraySorted(children, this.sortPreThingsXDec),
                    "yInc": this.getArraySorted(children, this.sortPreThingsYInc),
                    "yDec": this.getArraySorted(children, this.sortPreThingsYDec)
                };
                // Adding in a "push" lambda allows MapsCreatr to interact with
                // this using the same .push syntax as Arrays.
                array.push = (function (prething) {
                    scope.addArraySorted(this.xInc, prething, scope.sortPreThingsXInc);
                    scope.addArraySorted(this.xDec, prething, scope.sortPreThingsXDec);
                    scope.addArraySorted(this.yInc, prething, scope.sortPreThingsYInc);
                    scope.addArraySorted(this.yDec, prething, scope.sortPreThingsYDec);
                }).bind(array);
                output[i] = array;
            }
        }
        return output;
    };
    /* Utilities
    */
    /**
     * Creates an Object pre-populated with one key for each of the Strings in
     * the input Array, each pointing to a new Array.
     *
     * @param {String[]} arr
     * @return {Object}
     * @remarks This is a rough opposite of Object.keys, which takes in an
     *          Object and returns an Array of Strings.
     */
    MapsCreatr.prototype.fromKeys = function (arr) {
        var output = {}, i;
        for (i = 0; i < arr.length; i += 1) {
            output[arr[i]] = [];
        }
        return output;
    };
    /**
     * Returns a shallow copy of an Array, in sorted order based on a given
     * sorter Function.
     *
     * @param {Array} array
     * @param {Function} sorter
     * @
     */
    MapsCreatr.prototype.getArraySorted = function (array, sorter) {
        var copy = array.slice();
        copy.sort(sorter);
        return copy;
    };
    /**
     * Adds an element into an Array using a sorter Function.
     *
     * @param {Array} array
     * @param {Mixed} element
     * @param {Function} sorter   A Function that returns the difference between
     *                            two elements (for example, a Numbers sorter
     *                            given (a,b) would return a - b).
     */
    MapsCreatr.prototype.addArraySorted = function (array, element, sorter) {
        var lower = 0, upper = array.length, index;
        while (lower !== upper) {
            index = ((lower + upper) / 2) | 0;
            // Case: element is less than the index
            if (sorter(element, array[index]) < 0) {
                upper = index;
            }
            else {
                // Case: element is higher than the index
                lower = index + 1;
            }
        }
        if (lower === upper) {
            array.splice(lower, 0, element);
            return;
        }
    };
    /**
     * Sorter for PreThings that results in increasing horizontal order.
     *
     * @param {PreThing} a
     * @param {PreThing} b
     */
    MapsCreatr.prototype.sortPreThingsXInc = function (a, b) {
        return a.left === b.left ? a.top - b.top : a.left - b.left;
    };
    /**
     * Sorter for PreThings that results in decreasing horizontal order.
     *
     * @param {PreThing} a
     * @param {PreThing} b
     */
    MapsCreatr.prototype.sortPreThingsXDec = function (a, b) {
        return b.right === a.right ? b.bottom - a.bottom : b.right - a.right;
    };
    /**
     * Sorter for PreThings that results in increasing vertical order.
     *
     * @param {PreThing} a
     * @param {PreThing} b
     */
    MapsCreatr.prototype.sortPreThingsYInc = function (a, b) {
        return a.top === b.top ? a.left - b.left : a.top - b.top;
    };
    /**
     * Sorter for PreThings that results in decreasing vertical order.
     *
     * @param {PreThing} a
     * @param {PreThing} b
     */
    MapsCreatr.prototype.sortPreThingsYDec = function (a, b) {
        return b.bottom === a.bottom ? b.right - a.right : b.bottom - a.bottom;
    };
    return MapsCreatr;
})();
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
/// <reference path="MapsCreatr/MapsCreatr.ts" />
/// <reference path="MapsCreatr/MapsCreatrObjects.d.ts" />
/// <reference path="MapScreenr/MapScreenr.ts" />
/**
 * MapsHandlr.js
 *
 * Map manipulator and spawner for GameStarter maps that is the front-end
 * counterpart to MapsCreatr. PreThing listings are loaded from Maps stored in a
 * MapsCreatr and added or removed from user input. Area properties are given to
 * a MapScreenr when a new Area is loaded.
 *
 * Examples are not available for MapsHandlr, as the required code would be very
 * substantial. Instead see GameStartr.js and its map manipulation code.
 *
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var MapsHandlr = (function () {
    /**
     * @param {IMapsHandlrSettings} settings
     */
    function MapsHandlr(settings) {
        if (!settings) {
            throw new Error("No settings given to MapsHandlr.");
        }
        // Maps themselves should have been created in the MapsCreator object
        if (!settings.MapsCreator) {
            throw new Error("No MapsCreator provided to MapsHandlr.");
        }
        this.MapsCreator = settings.MapsCreator;
        // Map/Area attributes will need to be stored in a MapScreenr object
        if (!settings.MapScreener) {
            throw new Error("No MapScreener provided to MapsHandlr.");
        }
        this.MapScreener = settings.MapScreener;
        this.onSpawn = settings.onSpawn;
        this.onUnspawn = settings.onUnspawn;
        this.screenAttributes = settings.screenAttributes || [];
        this.stretchAdd = settings.stretchAdd;
        this.afterAdd = settings.afterAdd;
    }
    /* Simple gets
    */
    /**
     * @return {MapsCreatr}   The internal MapsCreator.
     */
    MapsHandlr.prototype.getMapsCreator = function () {
        return this.MapsCreator;
    };
    /**
     * @return {MapScreenr}   The internal MapScreener.
     */
    MapsHandlr.prototype.getMapScreener = function () {
        return this.MapScreener;
    };
    /**
     * @return {String[]}   The attribute names to be copied to MapScreener.
     */
    MapsHandlr.prototype.getScreenAttributes = function () {
        return this.screenAttributes;
    };
    /**
     * @return {String}   The key by which the current Map is indexed.
     */
    MapsHandlr.prototype.getMapName = function () {
        return this.mapName;
    };
    /**
     * Gets the map listed under the given name. If no name is provided, the
     * mapCurrent is returned instead.
     *
     * @param {String} [name]   An optional key to find the map under.
     * @return {Map}
     */
    MapsHandlr.prototype.getMap = function (name) {
        if (name === void 0) { name = undefined; }
        if (typeof name !== "undefined") {
            return this.MapsCreator.getMap(name);
        }
        else {
            return this.mapCurrent;
        }
    };
    /**
     * Simple getter pipe to the internal MapsCreator.getMaps() function.
     *
     * @return {Object<Map>}   A listing of maps, keyed by their names.
     */
    MapsHandlr.prototype.getMaps = function () {
        return this.MapsCreator.getMaps();
    };
    /**
     * @return {Area} The current Area.
     */
    MapsHandlr.prototype.getArea = function () {
        return this.areaCurrent;
    };
    /**
     * @return {String} The name of the current Area.
     */
    MapsHandlr.prototype.getAreaName = function () {
        return this.areaCurrent.name;
    };
    /**
     * @param {String} location   The key of the Location to return.
     * @return {Location} A Location within the current Map.
     */
    MapsHandlr.prototype.getLocation = function (location) {
        return this.areaCurrent.map.locations[location];
    };
    /**
     * Simple getter function for the internal prethings object. This will be
     * undefined before the first call to setMap.
     *
     * @return {Object} A listing of the current area's Prethings.
     */
    MapsHandlr.prototype.getPreThings = function () {
        return this.prethings;
    };
    /* Map / location setting
    */
    /**
     * Sets the currently manipulated Map in the handler to be the one under a
     * given name. Note that this will do very little unless a location is
     * provided.
     *
     * @param {String} name   A key to find the map under.
     * @param {Mixed} [location]   An optional key for a location to immediately
     *                              start the map in (if not provided, ignored).
     *
     */
    MapsHandlr.prototype.setMap = function (name, location) {
        if (location === void 0) { location = undefined; }
        // Get the newly current map from this.getMap normally
        this.mapCurrent = this.getMap(name);
        if (!this.mapCurrent) {
            throw new Error("Unknown Map in setMap: '" + name + "'.");
        }
        this.mapName = name;
        // Most of the work is done by setLocation (by default, the map's first)
        if (arguments.length > 1) {
            this.setLocation(location);
        }
        return this.mapCurrent;
    };
    /**
     * Goes to a particular location in the given map. Area attributes are
     * copied to the MapScreener, PreThings are loaded, and stretches and afters
     * are checked.
     *
     * @param {String} name   The key of the Location to start in.
     */
    MapsHandlr.prototype.setLocation = function (name) {
        var location, attribute, i;
        // Query the location from the current map and ensure it exists
        location = this.mapCurrent.locations[name];
        if (!location) {
            throw new Error("Unknown location in setLocation: '" + name + "'.");
        }
        // Since the location is valid, mark it as current (with its area)
        this.locationCurrent = location;
        this.areaCurrent = location.area;
        this.areaCurrent.boundaries = {
            "top": 0,
            "right": 0,
            "bottom": 0,
            "left": 0
        };
        for (i = 0; i < this.screenAttributes.length; i += 1) {
            attribute = this.screenAttributes[i];
            this.MapScreener[attribute] = this.areaCurrent[attribute];
        }
        // Reset the prethings object, enabling it to be used as a fresh start
        // for the new Area/Location placements
        this.prethings = this.MapsCreator.getPreThings(location.area);
        // Optional: set stretch commands
        if (this.areaCurrent.stretches) {
            this.setStretches(this.areaCurrent.stretches);
        }
        else {
            this.stretches = undefined;
        }
        // Optional: set after commands
        if (this.areaCurrent.afters) {
            this.setAfters(this.areaCurrent.afters);
        }
        else {
            this.afters = undefined;
        }
    };
    /**
     * Applies the stretchAdd Function to each given "stretch" command and
     * stores the commands in stretches.
     *
     * @param {Object[]} stretchesRaw
     */
    MapsHandlr.prototype.setStretches = function (stretchesRaw) {
        this.stretches = stretchesRaw;
        this.stretches.forEach(this.stretchAdd);
    };
    /**
     * Applies the afterAdd Function to each given "after" command and stores
     * the commands in afters.
     *
     * @param {Object[]} aftersRaw
     */
    MapsHandlr.prototype.setAfters = function (aftersRaw) {
        this.afters = aftersRaw;
        this.afters.forEach(this.afterAdd);
    };
    /**
     * Calls onSpawn on every PreThing touched by the given bounding box,
     * determined in order of the given direction. This is a simple wrapper
     * around applySpawnAction that also gives it true as the status.
     *
     * @param {String} direction   The direction by which to order PreThings:
     *                             "xInc", "xDec", "yInc", or "yDec".
     * @param {Number} top   The upper-most bound to spawn within.
     * @param {Number} right   The right-most bound to spawn within.
     * @param {Number} bottom    The bottom-most bound to spawn within.
     * @param {Number} left    The left-most bound to spawn within.
     */
    MapsHandlr.prototype.spawnMap = function (direction, top, right, bottom, left) {
        if (this.onSpawn) {
            this.applySpawnAction(this.onSpawn, true, direction, top, right, bottom, left);
        }
    };
    /**
     * Calls onUnspawn on every PreThing touched by the given bounding box,
     * determined in order of the given direction. This is a simple wrapper
     * around applySpawnAction that also gives it false as the status.
     *
     * @param {String} direction   The direction by which to order PreThings:
     *                             "xInc", "xDec", "yInc", or "yDec".
     * @param {Number} top   The upper-most bound to spawn within.
     * @param {Number} right   The right-most bound to spawn within.
     * @param {Number} bottom    The bottom-most bound to spawn within.
     * @param {Number} left    The left-most bound to spawn within.
     */
    MapsHandlr.prototype.unspawnMap = function (direction, top, right, bottom, left) {
        if (this.onUnspawn) {
            this.applySpawnAction(this.onUnspawn, false, direction, top, right, bottom, left);
        }
    };
    /**
     * Calls onUnspawn on every PreThing touched by the given bounding box,
     * determined in order of the given direction. This is used both to spawn
     * and un-spawn PreThings, such as during QuadsKeepr shifting. The given
     * status is used as a filter: all PreThings that already have the status
     * (generally true or false as spawned or unspawned, respectively) will have
     * the callback called on them.
     *
     * @param {Function} callback   The callback to be run whenever a matching
     *                              matching PreThing is found.
     * @param {Boolean} status   The spawn status to match PreThings against.
     *                           Only PreThings with .spawned === status will
     *                           have the callback applied to them.
     * @param {String} direction   The direction by which to order PreThings:
     *                             "xInc", "xDec", "yInc", or "yDec".
     * @param {Number} top   The upper-most bound to apply within.
     * @param {Number} right   The right-most bound to apply within.
     * @param {Number} bottom    The bottom-most bound to apply within.
     * @param {Number} left    The left-most bound to apply within.
     * @todo This will almost certainly present problems when different
     *       directions are used. For Pokemon/Zelda style games, the system
     *       will probably need to be adapted to use a Quadrants approach
     *       instead of plain Arrays.
     */
    MapsHandlr.prototype.applySpawnAction = function (callback, status, direction, top, right, bottom, left) {
        var name, group, prething, mid, start, end, i;
        for (name in this.prethings) {
            if (!this.prethings.hasOwnProperty(name)) {
                continue;
            }
            // Don't bother trying to spawn the group if it has no members
            group = this.prethings[name][direction];
            if (group.length === 0) {
                continue;
            }
            // Find the start and end points within the PreThings Array
            // Ex. if direction="xInc", go from .left >= left to .left <= right
            mid = (group.length / 2) | 0;
            start = this.findPreThingsSpawnStart(direction, group, mid, top, right, bottom, left);
            end = this.findPreThingsSpawnEnd(direction, group, mid, top, right, bottom, left);
            for (i = start; i <= end; i += 1) {
                prething = group[i];
                // For example: if status is true (spawned), don't spawn again
                if (prething.spawned !== status) {
                    prething.spawned = status;
                    callback(prething);
                }
            }
        }
    };
    /**
     * Finds the index from which PreThings should stop having an action
     * applied to them in applySpawnAction. This is less efficient than the
     * unused version below, but is more reliable for slightly unsorted groups.
     *
     * @param {String} direction   The direction by which to order PreThings:
     *                             "xInc", "xDec", "yInc", or "yDec".
     * @param {PreThing[]} group   The group to find a PreThing index within.
     * @param {Number} mid   The middle of the group. This is currently unused.
     * @param {Number} top   The upper-most bound to apply within.
     * @param {Number} right   The right-most bound to apply within.
     * @param {Number} bottom    The bottom-most bound to apply within.
     * @param {Number} left    The left-most bound to apply within.
     * @return {Number}
     */
    MapsHandlr.prototype.findPreThingsSpawnStart = function (direction, group, mid, top, right, bottom, left) {
        var directionKey = MapsHandlr.directionKeys[direction], directionEnd = this.getDirectionEnd(directionKey, top, right, bottom, left), i;
        for (i = 0; i < group.length; i += 1) {
            if (group[i][directionKey] >= directionEnd) {
                return i;
            }
        }
        return i;
    };
    /**
     * Finds the index from which PreThings should stop having an action
     * applied to them in applySpawnAction. This is less efficient than the
     * unused version below, but is more reliable for slightly unsorted groups.
     *
     * @param {String} direction   The direction by which to order PreThings:
     *                             "xInc", "xDec", "yInc", or "yDec".
     * @param {PreThing[]} group   The group to find a PreThing index within.
     * @param {Number} mid   The middle of the group. This is currently unused.
     * @param {Number} top   The upper-most bound to apply within.
     * @param {Number} right   The right-most bound to apply within.
     * @param {Number} bottom    The bottom-most bound to apply within.
     * @param {Number} left    The left-most bound to apply within.
     * @return {Number}
     */
    MapsHandlr.prototype.findPreThingsSpawnEnd = function (direction, group, mid, top, right, bottom, left) {
        var directionKey = MapsHandlr.directionKeys[direction], directionKeyOpposite = MapsHandlr.directionKeys[MapsHandlr.directionOpposites[direction]], directionEnd = this.getDirectionEnd(directionKeyOpposite, top, right, bottom, left), i;
        for (i = group.length - 1; i >= 0; i -= 1) {
            if (group[i][directionKey] <= directionEnd) {
                return i;
            }
        }
        return i;
    };
    /**
     * Conditionally returns a measurement based on what direction String is
     * given. This is useful for generically finding boundaries when the
     * direction isn't known, such as in findPreThingsSpawnStart and -End.
     *
     * @param {String} direction   The direction by which to order PreThings:
     *                             "xInc", "xDec", "yInc", or "yDec".
     * @param {Number} top   The upper-most bound to apply within.
     * @param {Number} right   The right-most bound to apply within.
     * @param {Number} bottom    The bottom-most bound to apply within.
     * @param {Number} left    The left-most bound to apply within.
     * @return {Number} top, right, bottom, or left, depending on direction.
     */
    MapsHandlr.prototype.getDirectionEnd = function (directionKey, top, right, bottom, left) {
        switch (directionKey) {
            case "top":
                return top;
            case "right":
                return right;
            case "bottom":
                return bottom;
            case "left":
                return left;
            default:
                throw new Error("Unknown directionKey: " + directionKey);
        }
    };
    // Directional equivalents for converting from directions to keys
    MapsHandlr.directionKeys = {
        "xInc": "left",
        "xDec": "right",
        "yInc": "top",
        "yDec": "bottom"
    };
    // Opposite directions for when finding descending order Arrays
    MapsHandlr.directionOpposites = {
        "xInc": "xDec",
        "xDec": "xInc",
        "yInc": "yDec",
        "yDec": "yInc"
    };
    return MapsHandlr;
})();
