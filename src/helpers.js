/* Helpers */
var util = require('util');

module.exports = {
    getCurrentDate: getCurrentDate,
    getLastBuildDate: getLastBuildDate,
    isCallFromJasmine: isCallFromJasmine
}

//////////

function getCurrentDate (isIncremental, currDate) {
    var now = currDate || new Date();
    var pad = function(i) {
        return ('0' + i).substr(-2);
    };
    var dateString = util.format('%d-%s-%s', now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate()));
    
    return (isIncremental)
        ? dateString + ' ' + util.format('%s:%s',  pad(now.getHours()), pad(now.getMinutes()))
        : dateString;
}

function getLastBuildDate(previousLog) {
    var dateStart = previousLog ? previousLog.indexOf('\(') : -1,
        dateEnd = previousLog ? previousLog.indexOf('\)') : -1;

    return (dateStart > -1 && dateEnd > -1) ? new Date(previousLog.substring(dateStart + 1, dateEnd)) : undefined;
}

function isCallFromJasmine(callingArg) {
    return callingArg && callingArg.indexOf('jasmine-node') !== -1;
}