var Base = require('./base');
var _ = require('underscore');

function Rsi(inputs, outputMap) {
    this.constructor = Rsi;
    Base.call(this, inputs, outputMap);

    if (!inputs.length) {
        throw 'No length input parameter provided.';
    }

    this.setMaxDataLength(this.getInput('length'));

    this.previousData = null;
    this.closeSource = this.getInput('closeSource') || 'close';
    this.previousAverageGain = null;
    this.previousAverageLoss = null;
}

// Create a copy of the Base "class" prototype for use in this "class."
Rsi.prototype = Object.create(Base.prototype);

Rsi.prototype.calculateInitialAverageGain = function(initialData, cumulativeData) {
    var self = this;
    var gainPreviousData = null;

    return _.reduce(cumulativeData, function(memo, data) {
        var change = gainPreviousData ? data[self.closeSource] - gainPreviousData[self.closeSource] : 0;
        var gain = gainPreviousData && change > 0 ? change : 0;

        gainPreviousData = data;

        return memo + gain;
    }, 0) / self.getData().length;
};

Rsi.prototype.calculateInitialAverageLoss = function(initialData, cumulativeData) {
    var self = this;
    var lossPreviousData = null;

    return _.reduce(cumulativeData, function(memo, data) {
        var change = lossPreviousData ? data[self.closeSource] - lossPreviousData[self.closeSource] : 0;
        var loss = lossPreviousData && change < 0 ? change * -1 : 0;

        lossPreviousData = data;

        return memo + loss;
    }, 0) / self.getData().length;
};

Rsi.prototype.tick = function(data) {
    var self = this;
    var cumulativeData = self.getData();
    var change = 0.0;
    var averageGain = 0.0;
    var averageLoss = 0.0;
    var currentGain = 0.0;
    var currentLoss = 0.0;
    var RS = 0.0;
    var returnValue = {};

    Base.prototype.tick.call(this, data);

    if (self.getData().length < this.getInput('length')) {
        return returnValue;
    }

    change = self.previousData ? data[self.closeSource] - self.previousData[self.closeSource] : 0;

    // Calculate the current gain and the current loss.
    currentGain = self.previousData && change > 0 ? change : 0;
    currentLoss = self.previousData && change < 0 ? change * -1 : 0;

    if (!this.previousAverageGain || !this.previousAverageLoss) {
        averageGain = this.previousAverageGain = this.calculateInitialAverageGain(data, cumulativeData);
        averageLoss = this.previousAverageLoss = this.calculateInitialAverageLoss(data, cumulativeData);
    }
    else {
        averageGain = this.previousAverageGain = ((this.previousAverageGain * (this.getInput('length') - 1)) + currentGain) / this.getInput('length');
        averageLoss = this.previousAverageLoss = ((this.previousAverageLoss * (this.getInput('length') - 1)) + currentLoss) / this.getInput('length');
    }

    RS = averageLoss > 0 ? averageGain / averageLoss : 0;

    returnValue[this.getOutputMapping('rsi')] = 100 - (100 / (1 + RS));

    self.previousData = data;

    return returnValue;
};

module.exports = Rsi;
