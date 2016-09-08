'use strict';

// Get parameters.
var argv = require('yargs').argv;
var populationSize = parseInt(argv.populationSize);
var evolutionCount = parseInt(argv.evolutionCount);
var minTradeCount = parseInt(argv.minTradeCount);
var seconds = parseInt(argv.seconds);

// Check parameters.
if (!argv.file) {
    console.error('No input file provided.');
    process.exit(1);
}
if (!argv.parser) {
    console.error('No parser specified.');
    process.exit(1);
}
if (!argv.populationSize) {
    console.error('No population size provided.');
    process.exit(1);
}
if (!argv.evolutionCount) {
    console.error('No evolution count provided.');
    process.exit(1);
}
if (!argv.minTradeCount) {
    console.error('No minimum trade count provided.');
    process.exit(1);
}
if (!argv.seconds) {
    console.error('No seconds value provided.');
    process.exit(1);
}

// State
var ticks = [];
var tickCount = ticks.length;
var tickIndex = {};

// Libraries
var _ = require('underscore');
var GeneticAlgorithm = require('geneticalgorithm');
var parser = require('../../lib/parsers/' + argv.parser + '.js');
var RsiIndicator = require('../../lib/indicators/rsi');
var BollingerBandsIndicator = require('../../lib/indicators/bollingerBands');
var MacdIndicator = require('../../lib/indicators/macd');

process.stdout.write('Loading data...');

// Load data.
parser.parse(argv.file).then(function(parsedTicks) {
    process.stdout.write('done\n');

    ticks = parsedTicks;
    tickCount = ticks.length;
    tickIndex = {};

    // Population for the algorithm.
    var population = [
        {rsiLength: 42, rsiOverbought: 95, rsiOversold: 5, bollingerBandsLength: 36, bollingerBandsDeviations: 1.4, macdShortEmaLength: 12, macdLongEmaLength: 26, macdSignalEmaLength: 9},
        {rsiLength: 42, rsiOverbought: 88, rsiOversold: 12, bollingerBandsLength: 36, bollingerBandsDeviations: 1.4, macdShortEmaLength: 12, macdLongEmaLength: 26, macdSignalEmaLength: 9},
        {rsiLength: 43, rsiOverbought: 96, rsiOversold: 4, bollingerBandsLength: 36, bollingerBandsDeviations: 1.4, macdShortEmaLength: 12, macdLongEmaLength: 26, macdSignalEmaLength: 9},
        {rsiLength: 29, rsiOverbought: 51, rsiOversold: 49, bollingerBandsLength: 24, bollingerBandsDeviations: 2.4, macdShortEmaLength: 12, macdLongEmaLength: 26, macdSignalEmaLength: 9},
        {rsiLength: 35, rsiOverbought: 93, rsiOversold: 7, bollingerBandsLength: 30, bollingerBandsDeviations: 1.8, macdShortEmaLength: 12, macdLongEmaLength: 26, macdSignalEmaLength: 9},
        {rsiLength: 34, rsiOverbought: 90, rsiOversold: 10, bollingerBandsLength: 30, bollingerBandsDeviations: 1.8, macdShortEmaLength: 12, macdLongEmaLength: 26, macdSignalEmaLength: 9},
        {rsiLength: 35, rsiOverbought: 88, rsiOversold: 12, bollingerBandsLength: 30, bollingerBandsDeviations: 1.8, macdShortEmaLength: 12, macdLongEmaLength: 26, macdSignalEmaLength: 9},
        {rsiLength: 35, rsiOverbought: 96, rsiOversold: 4, bollingerBandsLength: 30, bollingerBandsDeviations: 1.8, macdShortEmaLength: 12, macdLongEmaLength: 26, macdSignalEmaLength: 9}
    ];

    // Set up the machine learning algorithm.
    var geneticAlgorithm = GeneticAlgorithm({
        mutationFunction: mutationFunction,
        crossoverFunction: crossoverFunction,
        fitnessFunction: fitnessFunction,
        // doesABeatBFunction: competitionFunction,
        population: population,
        populationSize: populationSize
    });

    process.stdout.write('Building data index...');

    // Create a by-minute tick index.
    ticks.forEach(function(tick, index) {
        process.stdout.cursorTo(22);
        process.stdout.write(((index / tickCount) * 100).toFixed(2) + '%   ');

        tickIndex[tick.timestamp] = findFutureTick(tick, index);
    });

    process.stdout.cursorTo(22);
    process.stdout.write('100%   \n');

    // // Run the algorithm.
    // _.times(evolutionCount, function(index) {
    //     process.stdout.cursorTo(0);
    //     process.stdout.write('Evolution ' + (index + 1) + ' of ' + evolutionCount + '...');

    //     geneticAlgorithm.evolve();
    // });

    // var bestPhenotype = geneticAlgorithm.best();

    // // Show the results.
    // process.stdout.write('\n');
    // console.log(_.extend({}, bestPhenotype, backtest(bestPhenotype)));
    // process.stdout.write('\n');

    // Testing
    console.log({
        rsiLength: 35,
        rsiOverbought: 88,
        rsiOversold: 12,
        bollingerBandsLength: 13,
        bollingerBandsDeviations: 1.7,
        macdShortEmaLength: 8,
        macdLongEmaLength: 25,
        macdSignalEmaLength: 6
    });
    console.log(backtest({
        rsiLength: 35,
        rsiOverbought: 88,
        rsiOversold: 12,
        bollingerBandsLength: 13,
        bollingerBandsDeviations: 1.7,
        macdShortEmaLength: 8,
        macdLongEmaLength: 25,
        macdSignalEmaLength: 6
    }));
});

function mutationFunction(oldPhenotype) {
    var resultPhenotype = _.clone(oldPhenotype);

    // Select a random property to mutate.
    var propertyMin = 0;
    var propertyMax = 6;
    var propertyIndex = Math.floor(Math.random() * ((propertyMax - propertyMin) + 1)) + propertyMin;

    // Use oldPhenotype and some random function to make a change to the phenotype.
    switch (propertyIndex) {
        case 0:
            resultPhenotype.rsiLength = generateRandomNumber(2, 45);
            break;

        case 1:
            let change = generateRandomNumber(2, 50);

            resultPhenotype.rsiOverbought = 100 - change;
            resultPhenotype.rsiOversold = change;

            break;

        case 2:
            resultPhenotype.bollingerBandsLength = generateRandomNumber(10, 40);
            break;

        case 3:
            resultPhenotype.bollingerBandsDeviations = generateRandomNumber(1.4, 3.2, 1);
            break;

        case 4:
            resultPhenotype.macdShortEmaLength = generateRandomNumber(6, 18);
            break;

        case 5:
            resultPhenotype.macdLongEmaLength = generateRandomNumber(20, 32);
            break;

        case 6:
            resultPhenotype.macdSignalEmaLength = generateRandomNumber(3, 15);
            break;
    }

    return resultPhenotype;
}

function crossoverFunction(phenotypeA, phenotypeB) {
    var result1 = _.clone(phenotypeA);
    var result2 = _.clone(phenotypeB);

    // Use phenotypeA and B to create phenotype result 1 and 2.

    if (generateRandomNumber(0, 1)) {
        result1.rsiLength = phenotypeB.rsiLength;
        result2.rsiLength = phenotypeA.rsiLength;
    }

    if (generateRandomNumber(0, 1)) {
        result1.rsiOverbought = phenotypeB.rsiOverbought;
        result2.rsiOverbought = phenotypeA.rsiOverbought;
        result1.rsiOversold = phenotypeB.rsiOversold;
        result2.rsiOversold = phenotypeA.rsiOversold;
    }

    if (generateRandomNumber(0, 1)) {
        result1.bollingerBandsLength = phenotypeB.bollingerBandsLength;
        result2.bollingerBandsLength = phenotypeA.bollingerBandsLength;
    }

    if (generateRandomNumber(0, 1)) {
        result1.bollingerBandsDeviations = phenotypeB.bollingerBandsDeviations;
        result2.bollingerBandsDeviations = phenotypeA.bollingerBandsDeviations;
    }

    if (generateRandomNumber(0, 1)) {
        result1.macdShortEmaLength = phenotypeB.macdShortEmaLength;
        result2.macdShortEmaLength = phenotypeA.macdShortEmaLength;
    }

    if (generateRandomNumber(0, 1)) {
        result1.macdLongEmaLength = phenotypeB.macdLongEmaLength;
        result2.macdLongEmaLength = phenotypeA.macdLongEmaLength;
    }

    if (generateRandomNumber(0, 1)) {
        result1.macdSignalEmaLength = phenotypeB.macdSignalEmaLength;
        result2.macdSignalEmaLength = phenotypeA.macdSignalEmaLength;
    }

    return [result1, result2];
}

function fitnessFunction(phenotype) {
    var fitness = 0;

    // Use phenotype and possibly some other information to determine
    // the fitness number. Higher is better, lower is worse.

    var results = backtest(phenotype);

    if (results.tradeCount < minTradeCount) {
        return 0;
    }

    // Calculate the fitness based on the results and trade count.
    fitness = (results.winRate / 100);

    return fitness;
}

// function competitionFunction(phenotypeA, phenotypeB) {
//     // If too genetically similar to consider...
//     if (yourDiversityFunc(phenotypeA, phenotypeB) > MINIMUM_SIMILARITY) {
//        return false;
//     }

//     // If phenotypeA isn't better than phenotypeB...
//     if (fitnessFunction(phenotypeA) < fitnessFunction(phenotypeB)) {
//         return false;
//     }

//     // phenotypeA beats phenotypeB.
//     return true;
// }

function backtest(phenotype) {
    var cumulativeTicks = [];
    var previousTick = null;
    var previousFutureTick = null;
    var previousIndicatorValues = null;
    var bollingerBandLowerCounter = 0;
    var bollingerBandUpperCounter = 0;
    var stats = {
        tradeCount: 0,
        winCount: 0,
        loseCount: 0,
        breakEvenCount: 0
    };
    var indicators = {
        rsi: new RsiIndicator({length: phenotype.rsiLength}, {rsi: 'rsi'}),
        bollingerBands: new BollingerBandsIndicator({length: phenotype.bollingerBandsLength, deviations: phenotype.bollingerBandsDeviations}, {middle: 'bollingerBandMiddle', upper: 'bollingerBandUpper', lower: 'bollingerBandLower'}),
        macd: new MacdIndicator({shortEmaLength: phenotype.macdShortEmaLength, longEmaLength: phenotype.macdLongEmaLength, signalEmaLength: phenotype.macdSignalEmaLength}, {macd: 'macd', signal: 'macdSignal'})
    };

    ticks.forEach(function(tick, index) {
        // Reset things if there is >= an hour gap.
        if (previousTick && new Date(tick.timestamp) - new Date(previousTick.timestamp) > 60 * 60 * 1000) {
            cumulativeTicks = [];
            previousFutureTick = null;
            previousTick = null;

            delete indicators.rsi;
            delete indicators.bollingerBands;
            delete indicators.macd;

            indicators = {
                rsi: new RsiIndicator({length: phenotype.rsiLength}, {rsi: 'rsi'}),
                bollingerBands: new BollingerBandsIndicator({length: phenotype.bollingerBandsLength, deviations: phenotype.bollingerBandsDeviations}, {middle: 'bollingerBandMiddle', upper: 'bollingerBandUpper', lower: 'bollingerBandLower'}),
                macd: new MacdIndicator({shortEmaLength: phenotype.macdShortEmaLength, longEmaLength: phenotype.macdLongEmaLength, signalEmaLength: phenotype.macdSignalEmaLength}, {macd: 'macd', signal: 'macdSignal'})
            };
        }

        cumulativeTicks.push({close: tick.close});

        var futureTick = tickIndex[tick.timestamp];
        var indicatorValues = {};

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
                    indicatorValues[indicatorOutputs[indicatorProperty]] = indicatorTickValues[indicatorOutputs[indicatorProperty]];
                }
                else {
                    indicatorValues[indicatorOutputs[indicatorProperty]] = '';
                }
            }
        }

        // Don't worry about the last minute of the tick data.
        if (previousFutureTick && futureTick.timestamp === previousFutureTick.timestamp) {
            return;
        }

        if (indicatorValues.bollingerBandLower && tick.close < indicatorValues.bollingerBandLower) {
            bollingerBandLowerCounter = 5;
        }
        if (indicatorValues.bollingerBandUpper && tick.close > indicatorValues.bollingerBandUpper) {
            bollingerBandUpperCounter = 5;
        }

        // Call
        if (indicatorValues.rsi && indicatorValues.bollingerBandLower && indicatorValues.macd && indicatorValues.macdSignal) {
            if (previousIndicatorValues.rsi <= phenotype.rsiOversold && indicatorValues.rsi > phenotype.rsiOversold && bollingerBandLowerCounter > 0 && indicatorValues.macd < indicatorValues.macdSignal) {
                if (futureTick.close > tick.close) {
                    stats.tradeCount++;
                    stats.winCount++;
                }
                else if (futureTick.close < tick.close) {
                    stats.tradeCount++;
                    stats.loseCount++;
                }
                else if (futureTick.close === tick.close) {
                    stats.breakEvenCount++;
                }
            }
        }

        // Put
        if (indicatorValues.rsi && indicatorValues.bollingerBandUpper && indicatorValues.macd && indicatorValues.macdSignal) {
            if (previousIndicatorValues.rsi >= (100 - phenotype.rsiOverbought) && indicatorValues.rsi < (100 - phenotype.rsiOverbought) && bollingerBandUpperCounter > 0 && indicatorValues.macd > indicatorValues.macdSignal) {
                if (futureTick.close < tick.close) {
                    stats.tradeCount++;
                    stats.winCount++;
                }
                else if (futureTick.close > tick.close) {
                    stats.tradeCount++;
                    stats.loseCount++;
                }
                else if (futureTick.close === tick.close) {
                    stats.breakEvenCount++;
                }
            }
        }

        previousTick = tick;
        previousFutureTick = futureTick;
        previousIndicatorValues = indicatorValues;
        bollingerBandLowerCounter--;
        bollingerBandUpperCounter--;
    });

    // Free memory (just to be safe).
    delete indicators.rsi;
    delete indicators.bollingerBands;
    delete indicators.macd;

    // Calculate the win rate.
    stats.winRate = (stats.winCount / stats.tradeCount) * 100;

    return stats;
}

function findFutureTick(tick, startingIndex) {
    var index = 0;
    var futureTick = null;

    for (index = startingIndex; index < tickCount; index++) {

        if (futureTick && new Date(ticks[index].timestamp) - new Date(tick.timestamp) > seconds * 1000) {
            break;
        }
        else {
            futureTick = ticks[index];
        }
    }

    return futureTick;
}

function generateRandomNumber(min, max, decimals) {
    decimals = decimals || 0;

    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
