function Base(inputs, outputMap) {
    this.inputs = inputs;
    this.outputMap = outputMap;
    this.cumulativeData = [];
    this.maxDataLength = 100;
}

Base.prototype.setMaxDataLength = function(maxDataLength) {
    this.maxDataLength = maxDataLength;
};

Base.prototype.getData = function() {
    return this.cumulativeData;
};

Base.prototype.getDataSegment = function(length) {
    var dataLength = this.cumulativeData.length;

    // Get only last n data points, where n is either the length provided as input or the
    // length of the array (whichever is smallest so as to not surpass the data array length).
    var dataSegmentLength = Math.min(length, dataLength);

    return this.cumulativeData.slice(dataLength - dataSegmentLength, dataLength);
};

Base.prototype.getInput = function(key) {
    return this.inputs[key];
};

Base.prototype.getOutputMapping = function(key) {
    return this.outputMap[key];
};

Base.prototype.getOutputMappings = function() {
    return this.outputMap;
};

Base.prototype.tick = function(data) {
    this.cumulativeData.push(data);

    while (this.cumulativeData.length > this.maxDataLength) {
        this.cumulativeData.shift();
    }
};

// Source: http://www.strchr.com/standard_deviation_in_one_pass
Base.prototype.calculateStandardDeviation = function(values) {
    var valuesCount = values.length;
    var sum = 0;
    var squaredSum = 0;
    var mean = 0.0;
    var variance = 0.0;
    var i = 0;

    if (valuesCount === 0) {
        return 0.0;
    }

    for (i = 0; i < valuesCount; ++i) {
       sum += values[i];
       squaredSum += values[i] * values[i];
    }

    mean = sum / valuesCount;
    variance = squaredSum / valuesCount - mean * mean;

    return Math.sqrt(variance);
};

module.exports = Base;
