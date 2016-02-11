#!/usr/bin/env node
'use strict';

var q = require('qq'),
    fs = require('fs'),
    util = require('util'),
    argv = require('yargs').argv,
    child = require('child_process'),
    packageJson = require('./package.json');

var GIT_TAG_CMD = 'git describe --tags --abbrev=0';
var GIT_LOG_CMD = 'git log --grep="%s" -E --date=local --format=%s %s..HEAD';

var EMPTY_COMPONENT = '$$';
var HEADER_TPL = '<a name="%s"></a>\n# %s (%s)\n\n';

// Updated when sorting commits into sections in getSectionsFomCommits
var NO_COMMITS_TO_LOG = true;


/** Left TODO:
 *      - test generate function
 */

/* Export for Testing */
module.exports = {
    currentDate: currentDate,
    generate: generate,
    getFileName: getFileName,
    getRepoUrl: getRepoUrl,
    getIssueUrl: getIssueUrl,
    getLastBuildDate: getLastBuildDate,
    getPreviousChangelog: getPreviousChangelog,
    getSectionsFomCommits: getSectionsFomCommits,
    getUpdatedVersionName: getUpdatedVersionName,
    isCallFromMocha: isCallFromMocha,
    isEmptySection: isEmptySection,
    linkToIssue: linkToIssue,
    linkToCommit: linkToCommit,
    parseRawCommit: parseRawCommit,
    printSection: printSection,
    writeChangelog: writeChangelog
};

/* Execute Main function when called */
generate();

/* Main Function */
function generate() { // TODO: test
    // Keep from writing the changelog into the .spec file when using mocha in npm run test:tdd  (super weird)
    if(isCallFromMocha(process.argv[1]))
        return;

    getPreviousTag().then(function(tag) {

        console.log('Reading git log since', tag);

        var lastBuildDate,
            buildNumber = argv.build || 'SNAPSHOT',
            file = argv.file || getFileName(argv.incremental),
            version = argv.v || getUpdatedVersionName(argv.incremental, tag, buildNumber, packageJson);

        getPreviousChangelog(file).then(function (previousChangelog) {

            lastBuildDate = getLastBuildDate(previousChangelog);

            readGitLog('^fix|^feat|^perf|BREAKING', tag).then(function(commits) {

                console.log('Parsed', commits.length, 'commits');
                console.log('Generating changelog to', file, '(', version, ')');

                // Write log and append existing
                var writeStream = fs.createWriteStream(file, {flags: 'w'});
                writeChangelog(writeStream,
                               getSectionsFomCommits(commits, argv.incremental, lastBuildDate),
                               version,
                               NO_COMMITS_TO_LOG);
                writeStream.write(previousChangelog);

            });
        });
    });
}

/* Helper Functions */
function currentDate (isIncremental, currDate) {
    var now = currDate || new Date();
    var pad = function(i) {
        return ('0' + i).substr(-2);
    };

    var dateString = util.format('%d-%s-%s', now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate()));

    return (isIncremental)
        ? dateString + ' ' + util.format('%s:%s',  pad(now.getHours()), pad(now.getMinutes()))
        : dateString;
}

function getFileName(isIncremental) {
    return (isIncremental) ? 'BUILDLOG.md' : 'CHANGELOG.md'
}

function getIssueUrl(pJson) {
    // Verify package.json and repo url are specified
    if(!pJson || !pJson.bugs || !pJson.bugs.url) {
        var warnMessage = (!pJson) ? "No package.json available" : "No bugs url specified in package.json";
        warn(warnMessage);
        return '';
    }

    return pJson.bugs.url;
}

function getLastBuildDate(previousLog) {
    var dateStart = previousLog ? previousLog.indexOf('\(') : -1,
        dateEnd = previousLog ? previousLog.indexOf('\)') : -1;

    return (dateStart > -1 && dateEnd > -1) ? new Date(previousLog.substring(dateStart + 1, dateEnd)) : undefined;

}

function getPreviousChangelog(file) {
    var deferred = q.defer();

    fs.stat(file, function (err, stat) {
        if(err === null) {
            fs.readFile(file, 'utf8', function(err, fileData){
                (err === null) ? deferred.resolve(fileData) : deferred.resolve('');
            });
        }
        else {
            deferred.resolve('');
        }
    });

    return deferred.promise;
}

function getPreviousTag() {
    var deferred = q.defer();
    child.exec(GIT_TAG_CMD, function(code, stdout, stderr) {
        if (code) deferred.reject('Cannot get the previous tag.');
        else deferred.resolve(stdout.replace('\n', ''));
    });
    return deferred.promise;
}

function getRepoUrl(pJson) {
    var repoUrl = '';
    // Verify package.json and repo url are specified
    if(!pJson || !pJson.repository || !pJson.repository.url) {
        var warnMessage = (!pJson) ? "No package.json available" : "No repository specified in package.json";
        warn(warnMessage);
        return repoUrl;
    }

    repoUrl = pJson.repository.url;
    // Remove '/browse' from url (if present)
    var indexOfBrowse = repoUrl.indexOf('\/browse');

    repoUrl = (indexOfBrowse === -1)
        ? repoUrl
        : repoUrl.substring(0, indexOfBrowse);

    // Adjust for stash, bitbucket, or github in repo url (/commits vs /commit)
    repoUrl += (repoUrl.indexOf('github.com') !== -1 )
        ? '/commit'
        : '/commits';

    return repoUrl;
}

function getSectionsFomCommits(commits, isIncremental, lastBuildDate) {
    // Init sections
    var sections = {
        fix: {},
        feat: {},
        perf: {},
        breaks: {}
    };

    sections.breaks[EMPTY_COMPONENT] = [];

    // Loop through the commits and save the commit to its corresponding section
    commits.forEach(function(commit) {
        if( (isIncremental && commit.date > lastBuildDate) || !isIncremental ) {
            var section = sections[commit.type];
            var component = commit.component || EMPTY_COMPONENT;

            if (section) {
                section[component] = section[component] || [];
                section[component].push(commit);
            }

            if (commit.breaking) {
                sections.breaks[component] = sections.breaks[component] || [];
                sections.breaks[component].push({
                    subject: util.format("due to %s,\n %s", linkToCommit(commit.hash), commit.breaking),
                    hash: commit.hash,
                    closes: []
                });
            }

            NO_COMMITS_TO_LOG = false;
        }
    });

    return sections;
}

function getUpdatedVersionName(isIncremental, tagVersion, buildNumber, pJson) {
    if (isIncremental) {
        return (pJson && pJson.name) ? pJson.name + '-' + tagVersion + '.' + buildNumber : tagVersion
    }
    return tagVersion;
}

function isCallFromMocha(callingArg) {
    return callingArg && callingArg.indexOf('mocha') !== -1;
}

function isEmptySection(sectionComponents) {
    return ((sectionComponents.length === 1 && sectionComponents[0] === EMPTY_COMPONENT) || !sectionComponents.length)
}

function linkToCommit(hash) {
    var commitLink = '[%s](' + getRepoUrl(packageJson) + '\/%s)';
    return (hash) ? util.format(commitLink, hash.substr(0, 8), hash) : '';
}

function linkToIssue (issue) {
    var issueLink = '[#%s](' + getIssueUrl(packageJson) + '/%s)';
    return util.format(issueLink, issue, issue);
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
        warn('Incorrect message: %s %s', msg.hash, msg.subject);
        return null;
    }

    msg.type = match[1];
    msg.component = match[2];
    msg.subject = match[3];

    return msg;
}

function printSection(stream, title, section, printCommitLinks) {
    printCommitLinks = (printCommitLinks === undefined) ? true : printCommitLinks;
    var components = Object.getOwnPropertyNames(section).sort();

    if (isEmptySection(components)) return;

    stream.write(util.format('\n## %s\n\n', title));

    components.forEach(function(name) {
        var prefix = '-';
        var nested = section[name].length > 1;

        // Don't Print breaks[EMPTY_COMPONENT]
        if (name !== EMPTY_COMPONENT) {
            if (nested) {
                stream.write(util.format('- **%s:**\n', name));
                prefix = '  -';
            } else {
                prefix = util.format('- **%s:**', name);
            }
        }

        // Print each commit
        section[name].forEach(function(commit) {
            if (printCommitLinks) {
                stream.write(util.format('%s %s\n  (%s', prefix, commit.subject, linkToCommit(commit.hash)));
                if (commit.closes.length) {
                    stream.write(',\n   ' + commit.closes.map(linkToIssue).join(', '));
                }
                stream.write(')\n');
            } else {
                stream.write(util.format('%s %s\n', prefix, commit.subject));
            }
        });
    });

    stream.write('\n');
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

function warn() {
    console.log('WARNING:', util.format.apply(null, arguments));
}

function writeChangelog(stream, sections, version, noCommitsToLog) {
    stream.write(util.format(HEADER_TPL, version, version, currentDate(argv.incremental)));

    if(noCommitsToLog) {
        stream.write('### Nothing important to note\n\n');
    }
    else {
        printSection(stream, 'Bug Fixes', sections.fix);
        printSection(stream, 'Features', sections.feat);
        printSection(stream, 'Performance Improvements', sections.perf);
        printSection(stream, 'Breaking Changes', sections.breaks, false);
    }
}
