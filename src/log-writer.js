/* Log Writer */
var argv = require('yargs').argv,
    constants = require('./constants'),
    helpers = require('./helpers'),
    packageReader = require('./package-reader'),
    util = require('util');

var HEADER_TPL = '<a name="%s"></a>\n# %s (%s)\n\n';

module.exports = {
    isEmptySection: isEmptySection,
    linkToCommit: linkToCommit,
    linkToIssue: linkToIssue,
    printCommits: printCommits,
    printSection: printSection,
    writeChangelog: writeChangelog
};

//////////

function isEmptySection(sectionComponents) {
    return ((sectionComponents.length === 1 && sectionComponents[0] === constants.EMPTY_COMPONENT) || !sectionComponents.length)
}

function linkToCommit(hash) {
    var commitLink = '[%s](' + packageReader.getRepoUrl() + '\/%s)';
    return (hash) ? util.format(commitLink, hash.substr(0, 8), hash) : '';
}

function linkToIssue (issue) {
    var issueLink = '[#%s](' + packageReader.getIssueUrl() + '/%s)';
    return util.format(issueLink, issue, issue);
}

function printSection(stream, title, section, printCommitLinks) {
    var components = Object.getOwnPropertyNames(section).sort();
    if (isEmptySection(components)) {
        return;
    }

    stream.write(util.format('\n## %s\n\n', title));

    components.forEach(function(name) {
        var prefix = '-';
        var nested = section[name].length > 1;

        // Don't Print breaks[EMPTY_COMPONENT]
        if (name !== constants.EMPTY_COMPONENT) {
            if (nested) {
                stream.write(util.format('- **%s:**\n', name));
                prefix = '  -';
            } else {
                prefix = util.format('- **%s:**', name);
            }
        }

        printCommits(stream, section[name], prefix, printCommitLinks);
    });

    stream.write('\n');
}

function printCommits(stream, commits, prefix, printCommitLinks) {
    commits.forEach(function(commit) {
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
}

function writeChangelog(stream, sections, version, noCommitsToLog) {
    stream.write(util.format(HEADER_TPL, version, version, helpers.getCurrentDate(argv.incremental)));

    if(noCommitsToLog) {
        stream.write('### Nothing important to note\n\n');
    }
    else {
        printSection(stream, 'Bug Fixes', sections.fix, true);
        printSection(stream, 'Features', sections.feat, true);
        printSection(stream, 'Performance Improvements', sections.perf, true);
        printSection(stream, 'Breaking Changes', sections.breaks, false);
    }
}