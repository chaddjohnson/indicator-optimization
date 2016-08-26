'use strict';

// Libraries
var RsiIndicator = require('../../lib/indicators/rsi');
var BollingerBandsIndicator = require('../../lib/indicators/bollingerBands');

// Data
var ticks = require('../../data/EURUSD.json');
var tickCount = ticks.length;

// State
var tickIndex = {};
var cumulativeTicks = [];
var previousFutureTick = null;
var stats = {
    tradeCount: 0,
    winCount: 0,
    loseCount: 0,
    breakEvenCount: 0
};
var winRate = 0;
var maxWinRate = 0;
var optimialSettings = {};
var optimialStats = {};
var rsiLength = 0;
var rsiBounds = 0;
var bollingerBandsLength = 0;
var bollingerBandsDeviations = 0;
// var rsiLength = 29;
// var rsiBounds = 40;
// var bollingerBandsLength = 24;
// var bollingerBandsDeviations = 2.4;
var progress = 0;
var total = (30 - 1) * (40 - 1) * (25 - 17) * ((3.0 - 1.9) * 10);
var indicatorChanges = [];

// Indicators
var indicators = {};

// Create a by-minute tick index.
ticks.forEach(function(tick, index) {
    tickIndex[tick.timestamp] = findFutureTick(tick, index);
});

for (rsiLength = 2; rsiLength <= 30; rsiLength++) {
    for (rsiBounds = 2; rsiBounds <= 40; rsiBounds++) {
        for (bollingerBandsLength = 18; bollingerBandsLength <= 25; bollingerBandsLength++) {
            for (bollingerBandsDeviations = 2.0; bollingerBandsDeviations <= 3.0; bollingerBandsDeviations+=0.1) {
                process.stdout.cursorTo(0);
                process.stdout.write(++progress + ' of ' + total);

                stats = {
                    tradeCount: 0,
                    winCount: 0,
                    loseCount: 0,
                    breakEvenCount: 0
                };
                indicators = {
                    rsi: new RsiIndicator({length: rsiLength}, {rsi: 'rsi'}),
                    bollingerBands: new BollingerBandsIndicator({length: bollingerBandsLength, deviations: bollingerBandsDeviations}, {middle: 'bollingerBandMiddle', upper: 'bollingerBandUpper', lower: 'bollingerBandLower'})
                };
                cumulativeTicks = [];
                previousFutureTick = null;

                ticks.forEach(function(tick, index) {
                    cumulativeTicks.push({close: tick.mid});

                    var futureTick = tickIndex[tick.timestamp];

                    for (var indicatorIndex in indicators) {
                        let indicatorProperty = '';

                        // Get output mappings.
                        let indicatorOutputs = indicators[indicatorIndex].getOutputMappings();

                        // Set data for indicators.
                        indicators[indicatorIndex].setData(cumulativeTicks);

                        // Tick the indicator.
                        let indicatorTickValues = indicators[indicatorIndex].tick();

                        // Grab each output for the indicator.
                        for (indicatorProperty in indicatorOutputs) {
                            if (indicatorTickValues && typeof indicatorTickValues[indicatorOutputs[indicatorProperty]] === 'number') {
                                tick[indicatorOutputs[indicatorProperty]] = indicatorTickValues[indicatorOutputs[indicatorProperty]];
                            }
                            else {
                                tick[indicatorOutputs[indicatorProperty]] = '';
                            }
                        }
                    }

                    // Don't worry about the last minute of the tick data.
                    if (previousFutureTick && futureTick.timestamp === previousFutureTick.timestamp) {
                        return;
                    }

                    // Account for possible breaks.
                    if (futureTick.timestamp - tick.timestamp <= 50 * 1000) {
                        return;
                    }

                    // Call
                    if (tick.rsi <= rsiBounds && tick.mid > tick.bollingerBandUpper) {
                        if (futureTick.mid > tick.mid) {
                            stats.tradeCount++;
                            stats.winCount++;

                            // indicatorChanges.push({
                            //     value: tick.rsi,
                            //     change: futureTick.mid - tick.mid
                            // });
                        }
                        else if (futureTick.mid < tick.mid) {
                            stats.tradeCount++;
                            stats.loseCount++;
                        }
                        else if (futureTick.mid === tick.mid) {
                            stats.breakEvenCount++;
                        }
                    }
                    
                    // Put
                    if (tick.rsi >= (100 - rsiBounds) && tick.mid < tick.bollingerBandLower) {
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

                    delete tick.rsi;
                    delete tick.bollingerBandMiddle;
                    delete tick.bollingerBandUpper;
                    delete tick.bollingerBandLower;
                });

                winRate = (stats.winCount / stats.tradeCount) * 100;

                if (winRate > maxWinRate && stats.tradeCount >= 15) {
                    maxWinRate = winRate;
                    optimialSettings = {
                        rsiLength: rsiLength,
                        rsiOverbought: 100 - rsiBounds,
                        rsiOversold: rsiBounds,
                        bollingerBandsLength: bollingerBandsLength,
                        bollingerBandsDeviations: bollingerBandsDeviations
                    };
                    optimialStats = stats;
                }

                delete indicators.rsi;
                delete indicators.bollingerBands;
            }
        }
    }
}

process.stdout.write('\n');
console.log('WIN RATE = ' + maxWinRate.toFixed(2) + '%');
console.log('SETTINGS = ' + JSON.stringify(optimialSettings));
console.log(optimialStats);

// indicatorChanges.forEach(function(indicatorChange) {
//     console.log(indicatorChange.value + '\t' + indicatorChange.change);
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
