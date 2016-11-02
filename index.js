#!/usr/bin/env node
'use strict';

var fs = require('fs'),
    argv = require('yargs').argv;

var GitParser = require('./src/git-parser'),
    Helpers = require('./src/helpers'),
    LogWriter = require('./src/log-writer'),
    PackageReader = require('./src/package-reader');

/* Export for Testing */
module.exports = {
    generate: generate,
    getPreviousChangelog: getPreviousChangelog
};

generate();

function generate(isForTesting) {
    if(Helpers.isCallFromJasmine(process.argv[1]) && !isForTesting) {
        return false;
    }
    
    PackageReader.getPackage();
    var tag = GitParser.getPreviousTag();

    if(tag === 'NONE') {
        console.log('[ez-changelog] WARNING: no previous tag found.');
    }

    var buildNumber = argv.build || 'SNAPSHOT',
        file = argv.file || (argv.incremental) ? 'BUILDLOG.md' : 'CHANGELOG.md',
        version = argv.v || PackageReader.getUpdatedVersionName(argv.incremental, tag, buildNumber);
    
    var previousChangelog = getPreviousChangelog(file);
    var lastBuildDate = Helpers.getLastBuildDate(previousChangelog);
    var commits = GitParser.readGitLog(tag);
    
    console.log('[ez-changelog] INFO: Reading git log since ', tag);
    console.log('[ez-changelog] INFO: writing to ', file);
    console.log('[ez-changelog] INFO: Parsed', commits.length, 'commits');
    console.log('[ez-changelog] INFO: Generating changelog to', file, '(', version, ')');

    LogWriter.writeChangelog(commits, file, lastBuildDate, previousChangelog, version);
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
