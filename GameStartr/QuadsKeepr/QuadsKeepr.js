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
