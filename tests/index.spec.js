'use strict';

var changelog = require('../index'),
    argv = require('yargs').argv,
    fs = require('fs'),
    GitParser = require('../src/git-parser'),
    Helpers = require('../src/helpers'),
    LogWriter = require('../src/log-writer'),
    PackageReader = require('../src/package-reader');

describe('ez-changelog', function () {
    
    beforeEach(function () {
        spyOn(console, 'log');           
    });
    
    describe('generate', function () {

        beforeEach(function () {
            spyOn(PackageReader, 'getPackage').andCallThrough();
            spyOn(PackageReader, 'getUpdatedVersionName').andReturn('v1.1.7');
            spyOn(Helpers, 'getLastBuildDate').andReturn('01-01-1970');
            spyOn(fs, 'createWriteStream');
            spyOn(fs, 'readFileSync').andReturn("{}");
            spyOn(GitParser, 'readGitLog').andReturn(['some', 'commits']);
            spyOn(LogWriter, 'writeChangelog');
        });

        it('should generate the changelog', function() {
            spyOn(GitParser, 'getPreviousTag').andReturn('some tag');
            argv.incremental = false;
            argv.v = undefined;
            changelog.generate(true);

            expect(PackageReader.getPackage).toHaveBeenCalled();
            expect(GitParser.getPreviousTag).toHaveBeenCalled();
            expect(fs.readFileSync).toHaveBeenCalledWith('CHANGELOG.md', 'utf8');
            expect(PackageReader.getUpdatedVersionName).toHaveBeenCalledWith(undefined, 'some tag', 'SNAPSHOT');
            expect(Helpers.getLastBuildDate).toHaveBeenCalledWith('{}');
            expect(GitParser.readGitLog).toHaveBeenCalledWith('some tag');
        });
        
        it('should log that there was no previous tag found', function() {
            spyOn(GitParser, 'getPreviousTag').andReturn('NONE');
            argv.incremental = false;
            argv.v = undefined;
            changelog.generate(true);

            expect(console.log).toHaveBeenCalledWith('[ez-changelog] WARNING: no previous tag found.');
        });

    });

    describe('getPreviousChangelog', function () {
        it('should get empty string when no previous changelog ', function() {
            var prevChangeLog = changelog.getPreviousChangelog('poo.js');
            expect(prevChangeLog).toEqual('');
            expect(console.log).toHaveBeenCalledWith('[ez-changelog] WARNING: No previous log found, creating new one');
        });
    });

});