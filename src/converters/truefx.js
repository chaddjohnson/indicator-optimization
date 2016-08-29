var fs = require('fs');
var es = require('event-stream');

var stream;
var formattedData = [];

if (process.argv.length < 3) {
    throw 'No input file path provided.'
}
if (process.argv.length < 4) {
    throw 'No output file path provided.'
}

stream = fs.createReadStream(process.argv[2])
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
            var tick = {
                symbol: tickData[0].replace('/', ''),
                timestamp: new Date(tickData[1].replace(/(\d{4})(\d{2})(\d{2}) (\d{2}):(\d{2}):(\d{2})\.\d+/g, '$1-$2-$3 $4:$5:$6')).getTime(),
                bid: parseFloat(tickData[2]),
                ask: parseFloat(tickData[3])
            };

            tick.mid = (tick.bid + tick.ask) / 2;

            formattedData.push(tick);

            // Resume the read stream.
            stream.resume();
        })();
    }));

stream.on('close', function() {
    var file = fs.createWriteStream(process.argv[3]);

    file.on('error', function(error) {
        console.error(error);
    });

    formattedData.forEach(function(tick) {
        file.write(JSON.stringify(tick) + '\n');
    })

    file.end();
});
