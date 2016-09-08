var _ = require('underscore');
var Base = require('./base');
var RsiIndicator = require('../../lib/indicators/rsi');
var StochasticIndicator = require('../../lib/indicators/stochastic');

function StochRsi(inputs, outputMap) {
    this.constructor = StochRsi;
    Base.call(this, inputs, outputMap);

    if (!inputs.rsiLength) {
        throw 'No rsiLength input parameter provided to study.';
    }
    if (!inputs.stochasticLength) {
        throw 'No stochasticLength input parameter provided to study.';
    }
    if (!inputs.dLength) {
        throw 'No dLength input parameter provided to study.';
    }

    this.indicators = {
        rsi: new RsiIndicator({length: this.getInput('rsiLength'), closeSource: 'close'}, {rsi: 'rsi'}),
        highRsi: new RsiIndicator({length: this.getInput('rsiLength'), closeSource: 'high'}, {rsi: 'rsi'}),
        lowRsi: new RsiIndicator({length: this.getInput('rsiLength'), closeSource: 'low'}, {rsi: 'rsi'}),
        stochastic: new StochasticIndicator({length: this.getInput('stochasticLength'), dLength: this.getInput('dLength'), closeSource: 'rsi', lowSource: 'lowRsi', highSource: 'highRsi'}, {K: 'K', D: 'D'})
    };
}

// Create a copy of the Base "class" prototype for use in this "class."
StochRsi.prototype = Object.create(Base.prototype);

StochRsi.prototype.tick = function(data) {
    var returnValue = {};
    var dataCopy = _.clone(data);

    // Tick indicators, in order.
    var rsiValues = this.indicators.rsi.tick(data);
    var lowRsiValues = this.indicators.lowRsi.tick(data);
    var highRsiValues = this.indicators.highRsi.tick(data);

    dataCopy.rsi = rsiValues.rsi;
    dataCopy.highRsi = highRsiValues.rsi;
    dataCopy.lowRsi = lowRsiValues.rsi;

    var stochasticValues = this.indicators.stochastic.tick(dataCopy);

    dataCopy.K = stochasticValues.K;
    dataCopy.D = stochasticValues.D;

    returnValue[this.getOutputMapping('K')] = stochasticValues.K;
    returnValue[this.getOutputMapping('D')] = stochasticValues.D;

    return returnValue;
};

module.exports = StochRsi;
