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
                    timestamp: new Date(tickData[1].replace(/(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2}):(\d{2})\.\d+/g, '$1-$2-$3T$4:$5:$6Z')).getTime(),
                    mid: (parseFloat(tickData[2]) + parseFloat(tickData[3])) / 2
                };

                // Only use the last millisecond
                if (millisecondTicks.length && new Date(millisecondTick.timestamp).getSeconds() !== new Date(_.last(millisecondTicks).timestamp).getSeconds()) {
                    var lastTick = _.last(millisecondTicks);
                    var timestamp = lastTick.timestamp;
                    var close = lastTick.mid;
                    var high = _.max(millisecondTicks, function(tick) {
                        return tick.mid;
                    }).mid;
                    var low = _.max(millisecondTicks, function(tick) {
                        return tick.mid;
                    }).mid;

                    ticks.push({
                        timestamp: timestamp,
                        high: high,
                        low: low,
                        close: close
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
