/**
 * FPSAnalyzr.js
 *
 * A general utility for obtaining and analyzing framerate measurements. The
 * most recent measurements are kept up to a certain point (either an infinite
 * number or a set amount). Options for analyzing the data such as getting the
 * mean, median, extremes, etc. are available.
 *
 * @example
 * // Creating and using an FPSAnalyzr to measure setInterval accuracy.
 * var FPSAnalyzer = new FPSAnalyzr();
 * setInterval(FPSAnalyzer.measure.bind(FPSAnalyzer), 1000 / 30);
 * setTimeout(
 *     function () {
 *         console.log("Average FPS:", FPSAnalyzer.getAverage());
 *     },
 *     7000
 * );
 *
 * @example
 * // Creating and using an FPSAnalyzr to look at the 10 most recent FPS
 * // measurements and get the best & worst amounts.
 * var target = 1000 / 30,
 *     numKept = 10,
 *     FPSAnalyzer = new FPSAnalyzr({
 *         "maxKept": numKept
 *     }),
 *     i;
 *
 * for (i = 0; i < numKept; i += 1) {
 *     setTimeout(FPSAnalyzer.measure.bind(FPSAnalyzer), i * target);
 * }
 *
 * setTimeout(
 *     function () {
 *         console.log("Measurements:", FPSAnalyzer.getMeasurements());
 *         console.log("Extremes:", FPSAnalyzer.getExtremes());
 *         console.log("Range:", FPSAnalyzer.getRange());
 *     },
 *     numKept * i * target
 * );
 *
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var FPSAnalyzr = (function () {
    /**
     * Resets the FPSAnalyzr.
     *
     * @constructor
     * @param {Number} [maxKept]   The maximum number of FPS measurements to
     *                             keep. This defaults to 35, and can be a
     *                             Number or Infinity otherwise.
     * @param [Function} getTimestamp   A function used to get an accurate
     *                                  timestamp. By default this is
     *                                  performance.now.
     */
    function FPSAnalyzr(settings) {
        if (settings === void 0) { settings = {}; }
        this.maxKept = settings.maxKept || 35;
        this.numRecorded = 0;
        this.ticker = -1;
        // If maxKept is a Number, make the measurements array that long
        // If it's infinite, make measurements an {} (infinite array)
        this.measurements = isFinite(this.maxKept) ? new Array(this.maxKept) : {};
        // Headless browsers like PhantomJS won't know performance, so Date.now
        // is used as a backup
        if (typeof settings.getTimestamp === "undefined") {
            if (typeof performance === "undefined") {
                this.getTimestamp = function () {
                    return Date.now();
                };
            }
            else {
                this.getTimestamp = (performance.now || performance.webkitNow || performance.mozNow || performance.msNow || performance.oNow).bind(performance);
            }
        }
        else {
            this.getTimestamp = settings.getTimestamp;
        }
    }
    /* Public interface
    */
    /**
     * Standard public measurement function.
     * Marks the current timestamp as timeCurrent, and adds an FPS measurement
     * if there was a previous timeCurrent.
     *
     * @param {DOMHighResTimeStamp} time   An optional timestamp, without which
     *                                     getTimestamp() is used instead.
     */
    FPSAnalyzr.prototype.measure = function (time) {
        if (time === void 0) { time = this.getTimestamp(); }
        if (this.timeCurrent) {
            this.addFPS(1000 / (time - this.timeCurrent));
        }
        this.timeCurrent = time;
    };
    /**
     * Adds an FPS measurement to measurements, and increments the associated
     * count variables.
     *
     * @param {Number} fps   An FPS calculated as the difference between two
     *                       timestamps.
     */
    FPSAnalyzr.prototype.addFPS = function (fps) {
        this.ticker = (this.ticker += 1) % this.maxKept;
        this.measurements[this.ticker] = fps;
        this.numRecorded += 1;
    };
    /* Gets
    */
    /**
     * @return {Number} The number of FPS measurements to keep.
     */
    FPSAnalyzr.prototype.getMaxKept = function () {
        return this.maxKept;
    };
    /**
     * @return {Number} The actual number of FPS measurements currently known.
     */
    FPSAnalyzr.prototype.getNumRecorded = function () {
        return this.numRecorded;
    };
    /**
     * @return {Number} The most recent performance.now timestamp.
     */
    FPSAnalyzr.prototype.getTimeCurrent = function () {
        return this.timeCurrent;
    };
    /**
     * @return {Number} The current position in measurements.
     */
    FPSAnalyzr.prototype.getTicker = function () {
        return this.ticker;
    };
    /**
     * Get function for a copy of the measurements listing (if the number of
     * measurements is less than the max, that size is used)
     *
     * @return {Object}   An object (normally an Array) of the most recent FPS
     *                    measurements
     */
    FPSAnalyzr.prototype.getMeasurements = function () {
        var fpsKeptReal = Math.min(this.maxKept, this.numRecorded), copy, i;
        if (isFinite(this.maxKept)) {
            copy = new Array(fpsKeptReal);
        }
        else {
            copy = {};
            copy.length = fpsKeptReal;
        }
        for (i = fpsKeptReal - 1; i >= 0; --i) {
            copy[i] = this.measurements[i];
        }
        return copy;
    };
    /**
     * Get function for a copy of the measurements listing, but with the FPS
     * measurements transformed back into time differences
     *
     * @return {Object}   An object (normally an Array) of the most recent FPS
     *                    time differences
     */
    FPSAnalyzr.prototype.getDifferences = function () {
        var copy = this.getMeasurements(), i;
        for (i = copy.length - 1; i >= 0; --i) {
            copy[i] = 1000 / copy[i];
        }
        return copy;
    };
    /**
     * @return {Number} The average recorded FPS measurement.
     */
    FPSAnalyzr.prototype.getAverage = function () {
        var total = 0, max = Math.min(this.maxKept, this.numRecorded), i;
        for (i = max - 1; i >= 0; --i) {
            total += this.measurements[i];
        }
        return total / max;
    };
    /**
     * @remarks This is O(n*log(n)), where n is the size of the history,
     *          as it creates a copy of the history and sorts it.
     * @return {Number} The median recorded FPS measurement.
     */
    FPSAnalyzr.prototype.getMedian = function () {
        var copy = this.getMeasurements().sort(), fpsKeptReal = copy.length, fpsKeptHalf = Math.floor(fpsKeptReal / 2);
        if (copy.length % 2 === 0) {
            return copy[fpsKeptHalf];
        }
        else {
            return (copy[fpsKeptHalf - 2] + copy[fpsKeptHalf]) / 2;
        }
    };
    /**
     * @return {Number[]} An Array containing the lowest and highest recorded
     *                    FPS measurements, in that order.
     */
    FPSAnalyzr.prototype.getExtremes = function () {
        var lowest = this.measurements[0], highest = lowest, max = Math.min(this.maxKept, this.numRecorded), fps, i;
        for (i = max - 1; i >= 0; --i) {
            fps = this.measurements[i];
            if (fps > highest) {
                highest = fps;
            }
            else if (fps < lowest) {
                lowest = fps;
            }
        }
        return [lowest, highest];
    };
    /**
     * @return {Number} The range of recorded FPS measurements
     */
    FPSAnalyzr.prototype.getRange = function () {
        var extremes = this.getExtremes();
        return extremes[1] - extremes[0];
    };
    return FPSAnalyzr;
})();
/// <reference path="External/FPSAnalyzr/FPSAnalyzr-0.2.0.ts" />
/**
 * GamesRunnr
 * A class to continuously series of "game" Functions. Each game is run in a
 * set order and the group is run as a whole at a particular interval, with a
 * configurable speed. Playback can be triggered manually, or driven by a timer
 * with pause and play hooks. For automated playback, statistics are
 * available via an internal FPSAnalyzer.
 * @example
 * // Creating and using a GamesRunnr to print the screen size every second.
 * var GamesRunner = new GamesRunnr({
 *     "interval": 1000,
 *     "games": [
 *         function () {
 *             console.log("Screen size: " + innerWidth + "x" + innerHeight);
 *         }
 *     ]
 * });
 * GamesRunner.play();
 * @example
 * // Creating and using a GamesRunnr to remove the first member of an Array
 * // and output the remaining members every second until only one is left.
 * var numbers = ['a', 'b', 'c', 'd'],
 *     GamesRunner = new GamesRunnr({
 *         "interval": 1000,
 *         "games": [
 *             numbers.pop.bind(numbers),
 *             console.log.bind(console, numbers),
 *             function () {
 *                 if (numbers.length === 1) {
 *                     GamesRunner.pause();
 *                     console.log("All done!");
 *                 }
 *             }
 *         ]
 *
 *     });
 * GamesRunner.play();
 * // After 1 second:  ['a', 'b', 'c']
 * // After 2 seconds: ['a', 'b']
 * // After 3 seconds: ['a']
 * //                  "All done!"
 * @author "Josh Goldberg" <josh@fullscreenmario.com>
 */
var GamesRunnr = (function () {
    /**
     * Resets the GamesRunnr.
     *
     * @param {IGamesRunnrSettings} settings
     */
    function GamesRunnr(settings) {
        var i;
        if (typeof settings.games === "undefined") {
            throw new Error("No games given to GamesRunnr.");
        }
        this.games = settings.games;
        this.interval = settings.interval || 1000 / 60;
        this.speed = settings.speed || 1;
        this.onPause = settings.onPause;
        this.onPlay = settings.onPlay;
        this.callbackArguments = settings.callbackArguments || [this];
        this.FPSAnalyzer = settings.FPSAnalyzer || new FPSAnalyzr();
        this.adjustFramerate = settings.adjustFramerate;
        this.scope = settings.scope || this;
        this.paused = true;
        this.upkeepScheduler = settings.upkeepScheduler || function (handler, timeout) {
            return setTimeout(handler, timeout);
        };
        this.upkeepCanceller = settings.upkeepCanceller || function (handle) {
            clearTimeout(handle);
        };
        this.upkeepBound = this.upkeep.bind(this);
        for (i = 0; i < this.games.length; i += 1) {
            this.games[i] = this.games[i].bind(this.scope);
        }
        this.setIntervalReal();
    }
    /* Gets
    */
    /**
     * @return {FPSAnalyzer} The FPSAnalyzer used in the GamesRunnr.
     */
    GamesRunnr.prototype.getFPSAnalyzer = function () {
        return this.FPSAnalyzer;
    };
    /**
     * @return {Boolean} Whether this is paused.
     */
    GamesRunnr.prototype.getPaused = function () {
        return this.paused;
    };
    /**
     * @return {Function[]} The Array of game Functions.
     */
    GamesRunnr.prototype.getGames = function () {
        return this.games;
    };
    /**
     * @return {Number} The interval between upkeeps.
     */
    GamesRunnr.prototype.getInterval = function () {
        return this.interval;
    };
    /**
     * @return {Number} The speed multiplier being applied to the interval.
     */
    GamesRunnr.prototype.getSpeed = function () {
        return this.speed;
    };
    /**
     * @return {Function} The optional trigger to be called on pause.
     */
    GamesRunnr.prototype.getOnPause = function () {
        return this.onPause;
    };
    /**
     * @return {Function} The optional trigger to be called on play.
     */
    GamesRunnr.prototype.getOnPlay = function () {
        return this.onPlay;
    };
    /**
     * @return {Array} Arguments to be given to the optional trigger Functions.
     */
    GamesRunnr.prototype.getCallbackArguments = function () {
        return this.callbackArguments;
    };
    /**
     * @return {Function} Function used to schedule the next upkeep.
     */
    GamesRunnr.prototype.getUpkeepScheduler = function () {
        return this.upkeepScheduler;
    };
    /**
     * @return {Function} Function used to cancel the next upkeep.
     */
    GamesRunnr.prototype.getUpkeepCanceller = function () {
        return this.upkeepCanceller;
    };
    /* Runtime
    */
    /**
     * Meaty function, run every <interval*speed> milliseconds, to mark an FPS
     * measurement and run every game once.
     */
    GamesRunnr.prototype.upkeep = function () {
        if (this.paused) {
            return;
        }
        // Prevents double upkeeping, in case a new upkeepNext was scheduled.
        this.upkeepCanceller(this.upkeepNext);
        if (this.adjustFramerate) {
            this.upkeepNext = this.upkeepScheduler(this.upkeepBound, this.intervalReal - (this.upkeepTimed() | 0));
        }
        else {
            this.upkeepNext = this.upkeepScheduler(this.upkeepBound, this.intervalReal);
            this.games.forEach(this.run);
        }
        this.FPSAnalyzer.measure();
    };
    /**
     * A utility for this.upkeep that calls the same games.forEach(run), timing
     * the total execution time.
     *
     * @return {Number} The total time spent, in milliseconds.
     */
    GamesRunnr.prototype.upkeepTimed = function () {
        var now = this.FPSAnalyzer.getTimestamp();
        this.games.forEach(this.run);
        return this.FPSAnalyzer.getTimestamp() - now;
    };
    /**
     * Continues execution of this.upkeep by calling it. If an onPlay has been
     * defined, it's called before.
     */
    GamesRunnr.prototype.play = function () {
        if (!this.paused) {
            return;
        }
        this.paused = false;
        if (this.onPlay) {
            this.onPlay(this);
        }
        this.upkeep();
    };
    /**
     * Stops execution of this.upkeep, and cancels the next call. If an onPause
     * has been defined, it's called after.
     */
    GamesRunnr.prototype.pause = function () {
        if (this.paused) {
            return;
        }
        this.paused = true;
        if (this.onPause) {
            this.onPause(this);
        }
        this.upkeepCanceller(this.upkeep);
    };
    /**
     * Calls upkeep a <num or 1> number of times, immediately.
     *
     * @param {Number} [num]   How many times to upkeep, if not 1.
     */
    GamesRunnr.prototype.step = function (times) {
        this.play();
        this.pause();
        if (times > 0) {
            this.step(times - 1);
        }
    };
    /**
     * Toggles whether this is paused, and calls the appropriate Function.
     */
    GamesRunnr.prototype.togglePause = function () {
        this.paused ? this.play() : this.pause();
    };
    /* Games manipulations
    */
    /**
     * Sets the interval between between upkeeps.
     *
     * @param {Number} The new time interval in milliseconds.
     */
    GamesRunnr.prototype.setInterval = function (interval) {
        var intervalReal = Number(interval);
        if (isNaN(intervalReal)) {
            throw new Error("Invalid interval given to setInterval: " + interval);
        }
        this.interval = intervalReal;
        this.setIntervalReal();
    };
    /**
     * Sets the speed multiplier for the interval.
     *
     * @param {Number} The new speed multiplier. 2 will cause interval to be
     *                 twice as fast, and 0.5 will be half as fast.
     */
    GamesRunnr.prototype.setSpeed = function (speed) {
        var speedReal = Number(speed);
        if (isNaN(speedReal)) {
            throw new Error("Invalid speed given to setSpeed: " + speed);
        }
        this.speed = speedReal;
        this.setIntervalReal();
    };
    /* Utilities
    */
    /**
     * Sets the intervalReal variable, which is interval * (inverse of speed).
     */
    GamesRunnr.prototype.setIntervalReal = function () {
        this.intervalReal = (1 / this.speed) * this.interval;
    };
    /**
     * Curry function to fun a given function. Used in games.forEach(game).
     *
     * @param {Function} game
     */
    GamesRunnr.prototype.run = function (game) {
        game();
    };
    return GamesRunnr;
})();
