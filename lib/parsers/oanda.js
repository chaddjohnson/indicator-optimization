var q = require('q');

module.exports.parse = function(filePath) {
    var deferred = q.defer();

    deferred.resolve(require(filePath));

    return deferred.promise;
}
