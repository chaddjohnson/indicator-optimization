'use strict';

// Check parameters.
if (process.argv.length < 3) {
    console.error('No symbol provided.');
    process.exit(1);
}

// Parameters
var symbol = process.argv[2];
var minTradeCount = 10;
var populationSize = 100;
var evolutionCount = 100;

// Libraries
var _ = require('underscore');
var GeneticAlgorithm = require('geneticalgorithm');
var RsiIndicator = require('../../lib/indicators/rsi');
var BollingerBandsIndicator = require('../../lib/indicators/bollingerBands');

// Data
var ticks = require('../../data/' + symbol + '.json');
var tickCount = ticks.length;

// State
var tickIndex = {};

// Population for the algorithm.
var population = [
    // {rsiLength: 7, rsiOverbought: 70, rsiOversold: 30, bollingerBandsLength: 20, bollingerBandsDeviations: 2.0},
    {rsiLength: 7, rsiOverbought: 70, rsiOversold: 30, bollingerBandsLength: 22, bollingerBandsDeviations: 2.4},
    {rsiLength: 5, rsiOverbought: 95, rsiOversold: 5, bollingerBandsLength: 29, bollingerBandsDeviations: 2.2},
    // {rsiLength: 5, rsiOverbought: 95, rsiOversold: 5, bollingerBandsLength: 24, bollingerBandsDeviations: 2.7},
    // {rsiLength: 29, rsiOverbought: 80, rsiOversold: 20, bollingerBandsLength: 23, bollingerBandsDeviations: 2.3},
    {rsiLength: 29, rsiOverbought: 80, rsiOversold: 20, bollingerBandsLength: 25, bollingerBandsDeviations: 2.8},
    // {rsiLength: 2, rsiOverbought: 60, rsiOversold: 40, bollingerBandsLength: 21, bollingerBandsDeviations: 2.1},
    // {rsiLength: 6, rsiOverbought: 65, rsiOversold: 35, bollingerBandsLength: 27, bollingerBandsDeviations: 3.0},
    // {rsiLength: 8, rsiOverbought: 60, rsiOversold: 40, bollingerBandsLength: 23, bollingerBandsDeviations: 2.5},
    // {rsiLength: 21, rsiOverbought: 60, rsiOversold: 40, bollingerBandsLength: 24, bollingerBandsDeviations: 2.6},
    // {rsiLength: 28, rsiOverbought: 73, rsiOversold: 27, bollingerBandsLength: 26, bollingerBandsDeviations: 2.9},
    // {rsiLength: 25, rsiOverbought: 90, rsiOversold: 10, bollingerBandsLength: 19, bollingerBandsDeviations: 2.9},
    // {rsiLength: 18, rsiOverbought: 85, rsiOversold: 15, bollingerBandsLength: 18, bollingerBandsDeviations: 2.9}
];

// Set up the machine learning algorithm.
var geneticAlgorithm = GeneticAlgorithm({
    mutationFunction: mutationFunction,
    // crossoverFunction: crossoverFunction,
    fitnessFunction: fitnessFunction,
    // doesABeatBFunction: competitionFunction,
    population: population,
    populationSize: populationSize
});

// Create a by-minute tick index.
ticks.forEach(function(tick, index) {
    tickIndex[tick.createdAt] = findFutureTick(tick, index);
});

// Run the algorithm.
_.times(evolutionCount, function(index) {
    process.stdout.cursorTo(0);
    process.stdout.write('Evolution ' + (index + 1) + ' of ' + evolutionCount + '...');

    geneticAlgorithm.evolve();
});

// Show the results.
console.log(geneticAlgorithm.best());


function mutationFunction(oldPhenotype) {
    var resultPhenotype = _.clone(oldPhenotype);

    // Select a random property to mutate.
    var propertyMin = 0;
    var propertyMax = 3;
    var propertyIndex = Math.floor(Math.random() * ((propertyMax - propertyMin) + 1)) + propertyMin;

    // Use oldPhenotype and some random function to make a change to the phenotype.
    switch (propertyIndex) {
        case 0:
            resultPhenotype.rsiLength += generateRandomNumber(2, 35);
            break;

        case 1:
            let change = generateRandomNumber(2, 40);

            resultPhenotype.rsiOverbought += 100 - change;
            resultPhenotype.rsiOversold += change;

            break;

        case 2:
            resultPhenotype.bollingerBandsLength += generateRandomNumber(15, 30);
            break;

        case 3:
            resultPhenotype.bollingerBandsDeviations += generateRandomNumber(1.8, 3.2, 1);
            break;
    }

    return resultPhenotype;
}

function crossoverFunction(phenotypeA, phenotypeB) {
    var result1 = _.clone(phenotypeA);
    var result2 = _.clone(phenotypeB);

    // Use phenotypeA and B to create phenotype result 1 and 2.

    if (generateRandomNumber(0, 1)) {
        result1.rsiLength = phenotypeA.rsiLength;
        result2.rsiLength = phenotypeB.rsiLength;
    }

    if (generateRandomNumber(0, 1)) {
        result1.rsiOverbought = phenotypeA.rsiOverbought;
        result2.rsiOverbought = phenotypeB.rsiOverbought;
        result1.rsiOversold = phenotypeA.rsiOversold;
        result2.rsiOversold = phenotypeB.rsiOversold;
    }

    if (generateRandomNumber(0, 1)) {
        result1.bollingerBandsLength = phenotypeA.bollingerBandsLength;
        result2.bollingerBandsLength = phenotypeB.bollingerBandsLength;
    }

    if (generateRandomNumber(0, 1)) {
        result1.bollingerBandsDeviations = phenotypeA.bollingerBandsDeviations;
        result2.bollingerBandsDeviations = phenotypeB.bollingerBandsDeviations;
    }

    return [result1, result2];
}

function fitnessFunction(phenotype) {
    var fitness = 0;

    // Use phenotype and possibly some other information to determine
    // the fitness number. Higher is better, lower is worse.

    var results = backtest(phenotype);

    // Calculate the fitness based on the results and trade count.
    fitness = ((results.winRate / 100) * 0.5) + ((results.tradeCount / 100) * 0.5);

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

function backtest(settings) {
    var cumulativeTicks = [];
    var previousTick = null;
    var previousFutureTick = null;
    var stats = {
        tradeCount: 0,
        winCount: 0,
        loseCount: 0,
        breakEvenCount: 0
    };
    var indicators = {
        rsi: new RsiIndicator({length: settings.rsiLength}, {rsi: 'rsi'}),
        bollingerBands: new BollingerBandsIndicator({length: settings.bollingerBandsLength, deviations: settings.bollingerBandsDeviations}, {middle: 'bollingerBandMiddle', upper: 'bollingerBandUpper', lower: 'bollingerBandLower'})
    };

    ticks.forEach(function(tick, index) {
        // Reset things if there is >= an hour gap.
        if (previousTick && new Date(tick.createdAt) - new Date(previousTick.createdAt) > 60 * 60 * 1000) {
            cumulativeTicks = [];
            previousFutureTick = null;
            previousTick = null;

            delete indicators.rsi;
            delete indicators.bollingerBands;

            indicators = {
                rsi: new RsiIndicator({length: settings.rsiLength}, {rsi: 'rsi'}),
                bollingerBands: new BollingerBandsIndicator({length: settings.bollingerBandsLength, deviations: settings.bollingerBandsDeviations}, {middle: 'bollingerBandMiddle', upper: 'bollingerBandUpper', lower: 'bollingerBandLower'})
            };
        }

        cumulativeTicks.push({close: tick.mid});

        var futureTick = tickIndex[tick.createdAt];
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
        if (previousFutureTick && futureTick.createdAt === previousFutureTick.createdAt) {
            return;
        }

        // Call
        if (indicatorValues.rsi <= settings.rsiOversold && tick.mid > indicatorValues.bollingerBandUpper) {
            if (futureTick.mid > tick.mid) {
                stats.tradeCount++;
                stats.winCount++;
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
        if (indicatorValues.rsi >= (100 - settings.rsiOverbought) && tick.mid < indicatorValues.bollingerBandLower) {
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
    });

    // Free memory (just to be safe).
    delete indicators.rsi;
    delete indicators.bollingerBands;

    // Calculate the win rate.
    stats.winRate = (stats.winCount / stats.tradeCount) * 100;

    return stats;
}

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

function generateRandomNumber(min, max, decimals) {
    decimals = decimals || 0;

    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
