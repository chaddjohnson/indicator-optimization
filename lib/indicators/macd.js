var Base = require('./base');
var _ = require('underscore');

function Macd(inputs, outputMap) {
    this.constructor = Macd;
    Base.call(this, inputs, outputMap);

    if (!inputs.shortEmaLength) {
        throw 'No short EMA length parameter provided.';
    }
    if (!inputs.longEmaLength) {
        throw 'No long EMA length parameter provided.';
    }
    if (!inputs.signalEmaLength) {
        throw 'No MACD EMA length parameter provided.';
    }

    this.previousMacdValues = [];
}

// Create a copy of the Base "class" prototype for use in this "class."
Macd.prototype = Object.create(Base.prototype);

Macd.prototype.calculateMovingAverage = function(length) {
    var dataSegment = this.getDataSegment(length);

    return _.reduce(dataSegment, function(memo, tick) {
        return memo + tick.close;
    }, 0) / length;
};

Macd.prototype.tick = function() {
    var lastDataPoint = this.getLast();
    var shortEmaK = 0.0;
    var longEmaK = 0.0;
    var signalEmaK = 0.0;
    var shortEma = 0.0;
    var longEma = 0.0;
    var macd = 0.0;
    var signalEma = 0.0;
    var signal = 0.0;
    var returnValue = {};

    // Short EMA
    if (this.getDataPointCount() < this.getInput('shortEmaLength')) {
        return returnValue;
    }
    if (!this.previousShortEma) {
        this.previousShortEma = shortEma = this.calculateMovingAverage(this.getInput('shortEmaLength'));
    }
    else {
        shortEmaK = 2 / (1 + this.getInput('shortEmaLength'));
        shortEma = (lastDataPoint.close * shortEmaK) + (this.previousShortEma * (1 - shortEmaK));
    }

    this.previousShortEma = shortEma;

    // Long EMA
    if (this.getDataPointCount() < this.getInput('longEmaLength')) {
        return returnValue;
    }
    if (!this.previousLongEma) {
        this.previousLongEma = longEma = this.calculateMovingAverage(this.getInput('longEmaLength'));
    }
    else {
        longEmaK = 2 / (1 + this.getInput('longEmaLength'));
        longEma = (lastDataPoint.close * longEmaK) + (this.previousLongEma * (1 - longEmaK));
    }

    this.previousLongEma = longEma;

    // MACD line
    macd = shortEma - longEma;
    returnValue[this.getOutputMapping('macd')] = macd;

    // Signal line
    if (this.getDataPointCount() < (this.getInput('longEmaLength') + this.getInput('signalEmaLength')) - 1) {
        this.previousMacdValues.push(macd);
        return returnValue;
    }
    if (!this.previousSignal) {
        this.previousMacdValues.push(macd);

        this.previousSignal = signal = _.reduce(this.previousMacdValues, function(memo, value) {
            return memo + value;
        }, 0) / this.getInput('signalEmaLength');
    }
    else {
        signalEmaK = 2 / (1 + this.getInput('signalEmaLength'));
        signal = (macd * signalEmaK) + (this.previousSignal * (1 - signalEmaK));
    }

    // Signal line
    this.previousSignal = signal;
    returnValue[this.getOutputMapping('signal')] = signal;

    return returnValue;
};

module.exports = Macd;
