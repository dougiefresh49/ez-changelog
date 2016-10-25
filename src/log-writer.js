/* Log Writer */
var argv = require('yargs').argv,
    constants = require('./constants'),
    fs = require('fs'),
    util = require('util'),
    Helpers = require('./helpers'),
    PackageReader = require('./package-reader');

var HEADER_TPL = '<a name="%s"></a>\n# %s (%s)\n\n';
var NO_COMMITS_TO_LOG = true; // Note: Updated when sorting commits into sections in 'getSectionsFromCommits'
var EMPTY_COMPONENT = '$$';

module.exports = {
    isEmptySection: isEmptySection,
    getSectionsFromCommits: getSectionsFromCommits,
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

function getSectionsFromCommits(commits, lastBuildDate) {
    if(commits.length === 0 || !commits) {
        NO_COMMITS_TO_LOG = true;
    }
    var sections = PackageReader.getSectionsMap();
    sections.breaks[EMPTY_COMPONENT] = [];

    // Loop through the commits and save the commit to its corresponding section
    commits.forEach(function(commit) {
        if( (argv.incremental && commit.date > lastBuildDate) || !argv.incremental ) {
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

function linkToCommit(hash) {
    var commitLink = '[%s](' + PackageReader.getRepoUrl() + '\/%s)';
    return (hash) ? util.format(commitLink, hash.substr(0, 8), hash) : '';
}

function linkToIssue (issue) {
    var issueLink = '[#%s](' + PackageReader.getIssueUrl() + '/%s)';
    return util.format(issueLink, issue, issue);
}

function printSection(stream, title, section, printCommitLinks) {
    printCommitLinks = (printCommitLinks === undefined) ? true : printCommitLinks;
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

function writeChangelog(commits, file, lastBuildDate, previousLog, version) {
    var sections = getSectionsFromCommits(commits, lastBuildDate);
    var stream = fs.createWriteStream(file, {flags: 'w'});
    stream.write(util.format(HEADER_TPL, version, version, Helpers.getCurrentDate(argv.incremental)));

    if(NO_COMMITS_TO_LOG) {
        stream.write('### Nothing important to note\n\n');
    }
    else {
        var sectionsDetails = PackageReader.getSectionDetails();
        for(var sectionType in sections) {
            if(!sections.hasOwnProperty(sectionType)) continue;
            printSection(
                stream,
                sectionsDetails[sectionType].title,
                sections[sectionType],
                sectionsDetails[sectionType].printCommitLinks
            );
        }
    }
    
    stream.write(previousLog);
}