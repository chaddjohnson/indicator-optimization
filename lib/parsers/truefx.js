var fs = require('fs');
var es = require('event-stream');
var q = require('q');
var _ = require('underscore');

module.exports.parse = function(filePath) {
    var deferred = q.defer();
    var stream;
    var ticks = [];
    var millisecondTicks = [];

    stream = fs.createReadStream(filePath)
        .pipe(es.split())
        .pipe(es.mapSync(function(line) {
            // Pause the read stream.
            stream.pause();

            (function() {
                // Ignore blank lines.
                if (!line) {
                    stream.resume();
                    return;
                }

                var tickData = line.split(',') || [];
                var millisecondTick = {
                    timestamp: new Date(tickData[1].replace(/(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2}):(\d{2})\.\d+/g, '$1-$2-$3 $4:$5:$6')).getTime(),
                    bid: parseFloat(tickData[2]),
                    ask: parseFloat(tickData[3])
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

                // Resume the read stream.
                stream.resume();
            })();
        }));

    stream.on('close', function() {
        deferred.resolve(ticks);
    });

    return deferred.promise;
}
