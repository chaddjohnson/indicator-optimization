var q = require('q');
var _ = require('underscore');

module.exports.parse = function(filePath) {
    var deferred = q.defer();
    var rawTicks = require(filePath);
    var ticks = [];
    var millisecondTicks = [];

    rawTicks.forEach(function(rawTick) {
        var millisecondTick = {
            timestamp: new Date(rawTick.timestamp).getTime(),
            bid: rawTick.bid,
            ask: rawTick.ask
        };

        // Only use the last millisecond
        if (millisecondTicks.length && new Date(millisecondTick.timestamp).getSeconds() !== new Date(_.last(millisecondTicks).timestamp).getSeconds()) {
            var bid = _.reduce(millisecondTicks, function(memo, tick) {
                return memo + tick.bid;
            }, 0);
            var ask = _.reduce(millisecondTicks, function(memo, tick) {
                return memo + tick.ask;
            }, 0);
            var mid = _.reduce(millisecondTicks, function(memo, tick) {
                return memo + ((tick.bid + tick.ask) / 2);
            }, 0) / millisecondTicks.length;

            ticks.push({
                timestamp: millisecondTicks[0].timestamp,
                mid: mid
            });

            millisecondTicks = [];
        }

        millisecondTicks.push(millisecondTick);
    });

    deferred.resolve(ticks);

    return deferred.promise;
}
