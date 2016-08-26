'use strict';

if (process.argv.length < 3) {
    console.error('No symbol provided.');
    process.exit(1);
}

if (process.argv.length < 4) {
    console.error('No minTradeCount provided.');
    process.exit(1);
}

// Settings
var settings = require('../../settings.json');

// Parameters
var symbol = process.argv[2];
var minTradeCount = parseInt(process.argv[3]);

// Libraries
var RsiIndicator = require('../../lib/indicators/rsi');
var BollingerBandsIndicator = require('../../lib/indicators/bollingerBands');

// Data
var ticks = require('../../data/' + symbol + '.json');
var tickCount = ticks.length;

// State
var tickIndex = {};
var cumulativeTicks = [];
var previousTick = null;
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
var progress = 0;
var total = (30 - 1) * (40 - 1) * (25 - 17) * ((3.0 - 2.0) * 10);
var rsiLength = 0;
var rsiBounds = 0;
var bollingerBandsLength = 0;
var bollingerBandsDeviations = 0;
// var indicatorChanges = [];

// Indicators
var indicators = {};

// Create a by-minute tick index.
ticks.forEach(function(tick, index) {
    tickIndex[tick.createdAt] = findFutureTick(tick, index);
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
                    // Reset things if there is >= an hour gap.
                    if (previousTick && new Date(tick.createdAt) - new Date(previousTick.createdAt) > 60 * 60 * 1000) {
                        cumulativeTicks = [];
                        previousFutureTick = null;
                        previousTick = null;
                    }

                    cumulativeTicks.push({close: tick.mid});

                    var futureTick = tickIndex[tick.createdAt];

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
                    if (previousFutureTick && futureTick.createdAt === previousFutureTick.createdAt) {
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

                    previousTick = tick;
                    previousFutureTick = futureTick;

                    delete tick.rsi;
                    delete tick.bollingerBandMiddle;
                    delete tick.bollingerBandUpper;
                    delete tick.bollingerBandLower;
                });

                winRate = (stats.winCount / stats.tradeCount) * 100;

                if (winRate > maxWinRate && stats.tradeCount >= minTradeCount) {
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
        if (futureTick && new Date(ticks[index].createdAt) - new Date(tick.createdAt) > 60 * 1000) {
            break;
        }
        else {
            futureTick = ticks[index];
        }
    }

    return futureTick;
}
