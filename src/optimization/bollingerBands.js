'use strict';

// Libraries
var BollingerBandsIndicator = require('../../lib/indicators/bollingerBands');

// Data
var ticks = require('../../data/EURUSD.json');
var tickCount = ticks.length;

// State
var tickIndex = {};
var cumulativeTicks = [];
var previousFutureTick = null;
var stats = {};
var winRate = 0;
var maxWinRate = 0;
var optimialSettings = {};
var optimialStats = {};
var bollingerBandsLength = 0;
var bollingerBandsDeviations = 0;
var progress = 0;
var total = (25 - 14) * ((3.5 - 1.9) * 10);
var indicatorChanges = [];

// Indicators
var indicator = null;

// Create a by-minute tick index.
ticks.forEach(function(tick, index) {
    tickIndex[tick.timestamp] = findFutureTick(tick, index);
});

// Go through ticks.
for (bollingerBandsLength = 15; bollingerBandsLength <= 25; bollingerBandsLength++) {
    for (bollingerBandsDeviations = 2.0; bollingerBandsDeviations <= 3.5; bollingerBandsDeviations+=0.1) {
        process.stdout.cursorTo(0);
        process.stdout.write(++progress + ' of ' + total);

        stats = {
            tradeCount: 0,
            winCount: 0,
            loseCount: 0,
            breakEvenCount: 0
        };
        indicator = new BollingerBandsIndicator({length: bollingerBandsLength, deviations: bollingerBandsDeviations}, {middle: 'bollingerBandMiddle', upper: 'bollingerBandUpper', lower: 'bollingerBandLower'});
        cumulativeTicks = [];
        previousFutureTick = null;

        ticks.forEach(function(tick, index) {
            cumulativeTicks.push({close: tick.mid});
            indicator.setData(cumulativeTicks);

            var futureTick = tickIndex[tick.timestamp];
            var studyTickValues = indicator.tick();

            // Don't worry about the last minute of the tick data.
            if (futureTick === previousFutureTick) {
                return;
            }

            // Account for possible breaks.
            if (futureTick.timestamp - tick.timestamp <= 50 * 1000) {
                return;
            }

            // Call
            if (tick.mid > studyTickValues.bollingerBandUpper) {
                if (futureTick.mid > tick.mid) {
                    stats.tradeCount++;
                    stats.winCount++;
                }
                else if (futureTick.mid < tick.mid) {
                    stats.tradeCount++;
                    stats.loseCount++;

                    // indicatorChanges.push({
                    //     upper: tick.mid - studyTickValues.bollingerBandUpper,
                    //     change: futureTick.mid / tick.mid
                    // });
                }
                else if (futureTick.mid === tick.mid) {
                    stats.breakEvenCount++;
                }
            }
            
            // Put
            if (tick.mid < studyTickValues.bollingerBandLower) {
                if (futureTick.mid < tick.mid) {
                    stats.tradeCount++;
                    stats.winCount++;
                }
                else if (futureTick.mid > tick.mid) {
                    stats.tradeCount++;
                    stats.loseCount++;
                }
                else if (futureTick.mid === tick.mid) {
                    stats.breakEvenCount++;
                }
            }

            previousFutureTick = futureTick;
        });

        winRate = (stats.winCount / stats.tradeCount) * 100;

        if (winRate > maxWinRate && stats.tradeCount >= 1000) {
            maxWinRate = winRate;
            optimialSettings = {
                length: bollingerBandsLength,
                deviations: bollingerBandsDeviations
            };
            optimialStats = stats;
        }
    }
}

process.stdout.write('\n');
console.log('WIN RATE = ' + maxWinRate.toFixed(2) + '%');
console.log('SETTINGS = ' + JSON.stringify(optimialSettings));
console.log(optimialStats);

// indicatorChanges.forEach(function(indicatorChange) {
//     console.log(indicatorChange.upper + '\t' + indicatorChange.change);
// });

function findFutureTick(tick, startingIndex) {
    var index = 0;
    var futureTick = null;

    for (index = startingIndex; index < tickCount; index++) {
        if (futureTick && new Date(ticks[index].timestamp) - new Date(tick.timestamp) > 60 * 1000) {
            break;
        }
        else {
            futureTick = ticks[index];
        }
    }

    return futureTick;
}
