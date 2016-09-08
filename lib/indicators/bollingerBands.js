var Base = require('./base');
var _ = require('underscore');

function BollingerBands(inputs, outputMap) {
    this.constructor = BollingerBands;
    Base.call(this, inputs, outputMap);

    if (!inputs.length) {
        throw 'No length input parameter provided.';
    }
    if (!inputs.deviations) {
        throw 'No deviations input parameter provided.';
    }

    this.setMaxDataLength(this.getInput('length'));
}

// Create a copy of the Base "class" prototype for use in this "class."
BollingerBands.prototype = Object.create(Base.prototype);

BollingerBands.prototype.tick = function(data) {
    var self = this;
    var returnValue = {};
    var middle = 0.0;
    var middleStandardDeviation = 0.0;

    Base.prototype.tick.call(this, data);

    var cumulativeData = this.getData();
    var dataLength = self.getData().length;

    if (dataLength < this.getInput('length')) {
        return returnValue;
    }

    middle = _.reduce(cumulativeData, function(memo, dataPoint) {
        return memo + dataPoint.close;
    }, 0) / dataLength;

    middleStandardDeviation = self.calculateStandardDeviation(_.pluck(cumulativeData, 'close'));

    returnValue[self.getOutputMapping('middle')] = middle;

    // Calculate the upper band using the deviation factor.
    returnValue[self.getOutputMapping('upper')] = middle + (self.getInput('deviations') * middleStandardDeviation);

    // Calculate the lower band using the deviation factor.
    returnValue[self.getOutputMapping('lower')] = middle - (self.getInput('deviations') * middleStandardDeviation);

    return returnValue;
};

module.exports = BollingerBands;
