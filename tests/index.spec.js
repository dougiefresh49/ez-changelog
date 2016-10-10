'use strict';

var changelog = require('../index'),
    argv = require('yargs').argv,
    fs = require('fs'),
    q = require('qq'),
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
            spyOn(GitParser, 'getPreviousTag').andReturn(q.when('some tag'));
            spyOn(GitParser, 'readGitLog').andCallThrough();
            spyOn(PackageReader, 'getPackage');
            spyOn(PackageReader, 'getUpdatedVersionName').andReturn('v1.1.7');
            spyOn(Helpers, 'getLastBuildDate').andReturn('01-01-1970');
            spyOn(LogWriter, 'writeChangelog');
            spyOn(fs, 'createWriteStream');
        });

        it('should generate the changelog', function(done) {
            argv.incremental = false;
            argv.v = undefined;
            changelog.generate(true).then(function () {
                expect(PackageReader.getPackage).toHaveBeenCalled();
                expect(GitParser.getPreviousTag).toHaveBeenCalled();
                expect(PackageReader.getUpdatedVersionName).toHaveBeenCalledWith(undefined, 'some tag', 'SNAPSHOT');
                expect(Helpers.getLastBuildDate).toHaveBeenCalled();
                expect(GitParser.readGitLog).toHaveBeenCalledWith('^fix|^feat|^perf|BREAKING', 'some tag');
                done();
            });
        });
        
    });

    describe('getPreviousChangelog', function () {
        it('should get empty string when no previous changelog ', function() {
            var prevChangeLog = changelog.getPreviousChangelog('poo.js');
            expect(prevChangeLog).toEqual('');
            expect(console.log).toHaveBeenCalledWith('[ez-changelog] WARNING: No previous log found, creating new one');
        });
    });

    describe('getSectionsFromCommits', function () {
        it('should get default sections for no commits', function() {
            var sections = changelog.getSectionsFomCommits([]);
            expect(sections.fix).toEqual({});
            expect(sections.feat).toEqual({});
            expect(sections.perf).toEqual({});
            expect(sections.breaks).toEqual({'$$' : []});
        });

        it('should get sections from a commit of varying types', function() {
            var commits = [
                {
                    hash: '265d635cef8bdc16c286477beb948fd11e85bfc1',
                    subject: 'add ability to append to top of existing changelog vs bottom',
                    closes: [],
                    breaks: [],
                    body: '',
                    type: 'fix',
                    component: 'changelog'
                },
                {
                    hash: '298cffa6a7a36bcde5650323b5d6d0f6cec065e8',
                    subject: 'add initial readmen with examples and usage',
                    closes: [],
                    breaks: [],
                    body: '',
                    type: 'feat',
                    component: 'readme'
                },
                {
                    hash: 'bc587e5cff8342d1e70c807f982723473a05914a',
                    subject: 'change node executable to be named ez-changelog vs ezChangelog',
                    closes: [],
                    breaks: [],
                    breaking: ' v1.0.0 saved the node executable as ezChangelog whereas this update will save ' +
                    'the\nnode executable as ez-changelog. This was done for naming consistancy\n',
                    body: 'BREAKING CHANGE: v1.0.0 saved the node executable as ezChangelog whereas this update will' +
                    ' save the\nnode executable as ez-changelog. This was done for naming consistancy\n',
                    type: 'feat',
                    component: 'node executable'
                }
            ];

            var sections = changelog.getSectionsFomCommits(commits);
            expect(sections.fix.changelog.length).toEqual(1);
            expect(sections.fix.changelog[0].hash).toEqual('265d635cef8bdc16c286477beb948fd11e85bfc1');

            expect(sections.feat.readme.length).toEqual(1);
            expect(sections.feat.readme[0].hash).toEqual('298cffa6a7a36bcde5650323b5d6d0f6cec065e8');
        });

        it('should get sections from commits with dates with incremental on', function() {
            var commits = [
                {
                    hash: '265d635cef8bdc16c286477beb948fd11e85bfc1',
                    date: new Date('Sat Feb 6 12:04:15 2016'),
                    subject: 'add ability to append to top of existing changelog vs bottom',
                    closes: [],
                    breaks: [],
                    body: '',
                    type: 'fix',
                    component: 'changelog'
                },
                {
                    hash: '298cffa6a7a36bcde5650323b5d6d0f6cec065e8',
                    date: new Date('Sat Feb 6 12:04:15 2016'),
                    subject: 'add initial readmen with examples and usage',
                    closes: [],
                    breaks: [],
                    body: '',
                    type: 'feat',
                    component: 'readme'
                },
                {
                    hash: 'bc587e5cff8342d1e70c807f982723473a05914a',
                    date: new Date('Sat Feb 4 12:04:15 2016'),
                    subject: 'change node executable to be named ez-changelog vs ezChangelog',
                    closes: [],
                    breaks: [],
                    breaking: ' v1.0.0 saved the node executable as ezChangelog whereas this update will save ' +
                    'the\nnode executable as ez-changelog. This was done for naming consistancy\n',
                    body: 'BREAKING CHANGE: v1.0.0 saved the node executable as ezChangelog whereas this update will' +
                    ' save the\nnode executable as ez-changelog. This was done for naming consistancy\n',
                    type: 'feat',
                    component: 'node executable'
                }
            ];

            var sections = changelog.getSectionsFomCommits(commits, true, new Date('Sat Feb 5 12:04:15 2016'));
            expect(sections.fix.changelog.length).toEqual(1);
            expect(sections.fix.changelog[0].hash).toEqual('265d635cef8bdc16c286477beb948fd11e85bfc1');

            expect(sections.feat.readme.length).toEqual(1);
            expect(sections.feat.readme[0].hash).toEqual('298cffa6a7a36bcde5650323b5d6d0f6cec065e8');

            expect(sections.breaks['node executable']).toEqual(undefined);
        });
    });

});