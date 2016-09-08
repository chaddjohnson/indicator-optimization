'use strict';

var PrcIndicator = require('./lib/indicators/prc');
var prcIndicator = new PrcIndicator({length: 20, degree: 4, deviations: 2.0}, {regression: 'prcRegression', upper: 'prcUpper', lower: 'prcLower'});

var data = [459.99, 448.85, 446.06, 450.81, 442.8, 448.97, 444.57, 441.4, 430.47, 420.05, 431.14, 425.66, 430.58, 431.72, 437.87, 428.43, 428.35, 432.5, 443.66, 455.72, 454.49, 452.08, 452.73, 461.91, 463.58, 461.14, 452.08, 442.66, 428.91, 429.79, 431.99, 427.72, 423.2, 426.21, 426.98, 435.69, 434.33, 429.8, 419.85, 426.24, 402.8, 392.05, 390.53, 398.67, 406.13, 405.46, 408.38, 417.2, 430.12, 442.78, 439.29, 445.52, 449.98, 460.71, 458.66, 463.84, 456.77, 452.97, 454.74, 443.86, 428.85, 434.58, 433.26, 442.93, 439.66, 441.35];
var cumulativeData = [];

data.forEach(function(item) {
    cumulativeData.push({close: item});

    prcIndicator.setData(cumulativeData);
    var values = prcIndicator.tick();

    console.log(item + '\t' + values.prcLower + '\t' + values.prcUpper)
});
