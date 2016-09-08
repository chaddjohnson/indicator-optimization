var _ = require('underscore');
var Base = require('./base');

function Stochastic(inputs, outputMap) {
    this.constructor = Stochastic;
    Base.call(this, inputs, outputMap);

    if (!inputs.length) {
        throw 'No length input parameter provided to study.';
    }
    if (!inputs.dLength) {
        throw 'No dLength input parameter provided to study.';
    }

    this.setMaxDataLength(this.getInput('length'));

    this.closeSource = this.getInput('closeSource') || 'close';
    this.lowSource = this.getInput('lowSource') || 'low';
    this.highSource = this.getInput('highSource') || 'high';
}

// Create a copy of the Base "class" prototype for use in this "class."
Stochastic.prototype = Object.create(Base.prototype);

Stochastic.prototype.tick = function(data) {
    var self = this;
    var dLengthDataSegment = [];
    var low = 0.0;
    var high = 0.0;
    var highLowDifference = 0.0;
    var K = 0.0;
    var D = 0.0;
    var KOutputName = self.getOutputMapping('K');
    var returnValue = {};

    Base.prototype.tick.call(this, data);

    var cumulativeData = this.getData();
    var dataLength = self.getData().length;

    if (self.getData().length < this.getInput('length')) {
        return returnValue;
    }

    dLengthDataSegment = cumulativeData.slice(dataLength - self.getInput('dLength'), dataLength);

    low = _.min(_.map(cumulativeData, function(dataPoint) {
        return dataPoint[self.lowSource];
    }));
    high = _.max(_.map(cumulativeData, function(dataPoint) {
        return dataPoint[self.highSource];
    }));
    highLowDifference = high - low;
    K = highLowDifference > 0 ? 100 * ((data[self.closeSource] - low) / highLowDifference) : 0;
    D = _.reduce(dLengthDataSegment, function(memo, dataPoint) {
        if (typeof dataPoint[KOutputName] === 'number') {
            return memo + dataPoint[KOutputName];
        }
        else {
            // Use the current K value for the last data point.
            return memo + K;
        }
    }, 0) / dLengthDataSegment.length;

    returnValue[KOutputName] = K;
    returnValue[self.getOutputMapping('D')] = D;

    return returnValue;
};

module.exports = Stochastic;
