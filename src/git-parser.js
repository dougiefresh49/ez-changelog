/* Git Parser */
var util = require('util'),
    exec = require('sync-exec'),
    Constants = require('./constants'),
    PackageReader = require('./package-reader');

module.exports = {
    getPreviousTag: getPreviousTag,
    parseRawCommit: parseRawCommit,
    readGitLog: readGitLog
};

//////////

function getPreviousTag() {
    var output = exec(Constants.GIT_TAG_CMD);
    return (output.code) ? 'NONE' : output.stdout.replace('\n', '');
}

function parseRawCommit(raw) {
    if (!raw) return null;

    var lines = raw.split('\n');
    var msg = {}, match;

    msg.date = new Date(lines.shift());
    msg.hash = lines.shift();
    msg.subject = lines.shift();
    msg.closes = [];
    msg.breaks = [];

    lines.forEach(function(line) {
        match = line.match(/(?:Closes|Fixes)\s#(\d+)/);
        if (match) msg.closes.push(parseInt(match[1]));
    });

    match = raw.match(/BREAKING CHANGE:([\s\S]*)/);

    if (match) {
        msg.breaking = match[1];
    }

    msg.body = lines.join('\n');
    match = msg.subject.match(/^(.*)\((.*)\)\:\s(.*)$/);

    if (!match || !match[1] || !match[3]) {
        console.log('[ez-changelog] WARNING: Incorrect message: %s %s', msg.hash, msg.subject);
        return null;
    }

    msg.type = match[1];
    msg.component = match[2];
    msg.subject = match[3];

    return msg;
}

function readGitLog(fromTag) {
    var sectionsGrep = PackageReader
        .getSections()
        .map(function (section) {
            return '^' + section.type;
        })
        .join('|');
    
    var command = (fromTag === 'NONE')
        ? util.format(Constants.GIT_LOG_NO_TAG_CMD, sectionsGrep, '%cd%n%H%n%s%n%b%n==END==')
        : util.format(Constants.GIT_LOG_CMD, sectionsGrep, '%cd%n%H%n%s%n%b%n==END==', fromTag);
    
    var stdout = exec(command).stdout;
    var commits = [];

    stdout.split('\n==END==\n').forEach(function(rawCommit) {
        var commit = parseRawCommit(rawCommit);
        if (commit) commits.push(commit);
    });
    
    return commits;
}