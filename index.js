#!/usr/bin/env node
'use strict';

var fs = require('fs'),
    util = require('util'),
    argv = require('yargs').argv;

var GitParser = require('./src/git-parser'),
    Helpers = require('./src/helpers'),
    LogWriter = require('./src/log-writer'),
    PackageReader = require('./src/package-reader');

var EMPTY_COMPONENT = '$$';

// Updated when sorting commits into sections in getSectionsFromCommits
var NO_COMMITS_TO_LOG = true;

/* Export for Testing */
module.exports = {
    generate: generate,
    getPreviousChangelog: getPreviousChangelog,
    getSectionsFomCommits: getSectionsFromCommits
};

generate();

function generate(isForTesting) {
    if(Helpers.isCallFromJasmine(process.argv[1]) && !isForTesting) {
        return false;
    }
    
    PackageReader.getPackage();

    return GitParser.getPreviousTag().then(function(tag) {
        console.log('[ez-changelog] INFO: Reading git log since ', tag);

        var buildNumber = argv.build || 'SNAPSHOT',
            file = argv.file || (argv.incremental) ? 'BUILDLOG.md' : 'CHANGELOG.md',
            version = argv.v || PackageReader.getUpdatedVersionName(argv.incremental, tag, buildNumber); 
        
        var previousChangelog = getPreviousChangelog(file);
        var lastBuildDate = Helpers.getLastBuildDate(previousChangelog); 
        
        GitParser.readGitLog('^fix|^feat|^perf|BREAKING', tag).then(function(commits) {
            console.log('[ez-changelog] INFO: Parsed', commits.length, 'commits');
            console.log('[ez-changelog] INFO: Generating changelog to', file, '(', version, ')');

            // Write log and append existing
            var writeStream = fs.createWriteStream(file, {flags: 'w'});
            LogWriter.writeChangelog(
                writeStream,
                getSectionsFromCommits(commits, argv.incremental, lastBuildDate),
                version,
                NO_COMMITS_TO_LOG
            );
            writeStream.write(previousChangelog);
        });
    });
}

/* --- Helper Functions --- */

function getPreviousChangelog(file) {
    var previousLog;

    try {
        previousLog = fs.readFileSync(file, 'utf8')
    }
    catch (error){
        console.log('[ez-changelog] WARNING: No previous log found, creating new one');
        previousLog = '';
    }
    
    return previousLog;
}

function getSectionsFromCommits(commits, isIncremental, lastBuildDate) {
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
                    subject: util.format("due to %s,\n %s", LogWriter.linkToCommit(commit.hash), commit.breaking),
                    hash: commit.hash,
                    closes: []
                });
            }

            NO_COMMITS_TO_LOG = false;
        }
    });

    return sections;
}