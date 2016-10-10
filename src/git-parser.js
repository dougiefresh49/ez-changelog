/* Git Parser */
var q = require('qq'),
    util = require('util'),
    child = require('child_process');

var Constants = require('./constants')

module.exports = {
    getPreviousTag: getPreviousTag,
    parseRawCommit: parseRawCommit,
    readGitLog: readGitLog
};

var GIT_LOG_CMD = 'git log --grep="%s" -E --date=local --format=%s %s..HEAD';

//////////

function getPreviousTag() {
    var deferred = q.defer();
    child.exec(Constants.GIT_TAG_CMD, function(code, stdout, stderr) {
        if (code) deferred.reject('Cannot get the previous tag.');
        else deferred.resolve(stdout.replace('\n', ''));
    });
    return deferred.promise;
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

function readGitLog(grep, from) {
    var deferred = q.defer();

    // See https://git-scm.com/docs/pretty-formats for a full list of options
    child.exec(util.format(GIT_LOG_CMD, grep, '%cd%n%H%n%s%n%b%n==END==', from), function(code, stdout, stderr) {
        var commits = [];

        stdout.split('\n==END==\n').forEach(function(rawCommit) {
            var commit = parseRawCommit(rawCommit);
            if (commit) commits.push(commit);
        });

        deferred.resolve(commits);
    });

    return deferred.promise;
}