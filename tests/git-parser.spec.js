'use strict';

var util = require('util'),
    Constants = require('../src/constants'),
    GitParser = require('../src/git-parser'),
    PackageReader = require('../src/package-reader');

describe('git-parser', function () {
    
    describe('getPreviousTag', function () {
        it('should return a tag', function() {
            expect(typeof GitParser.getPreviousTag()).toEqual('string');
        });
    });
    
    describe('parseRawCommit', function() {
        it('should parse raw commit', function() {
            var msg = GitParser.parseRawCommit(
                'Sat Feb 6 12:04:15 2016\n' +
                '9b1aff905b638aa274a5fc8f88662df446d374bd\n' +
                'feat(scope): broadcast $destroy event on scope destruction\n' +
                'perf testing shows that in chrome this change adds 5-15% overhead\n' +
                'when destroying 10k nested scopes where each scope has a $destroy listener\n');

            expect(msg.date).toEqual(new Date('Sat Feb 6 12:04:15 2016'));
            expect(msg.type).toEqual('feat');
            expect(msg.hash).toEqual('9b1aff905b638aa274a5fc8f88662df446d374bd');
            expect(msg.subject).toEqual('broadcast $destroy event on scope destruction');
            expect(msg.body).toEqual('perf testing shows that in chrome this change adds 5-15% overhead\n' +
                'when destroying 10k nested scopes where each scope has a $destroy listener\n');
            expect(msg.component).toEqual('scope');
        });

        it('should parse closed issues', function() {
            var msg = GitParser.parseRawCommit(
                'Sat Feb 6 12:04:15 2016\n' +
                '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
                'feat(ng-list): Allow custom separator\n' +
                'bla bla bla\n\n' +
                'Closes #123\nCloses #25\n');

            expect(msg.closes).toEqual([123, 25]);
        });

        it('should parse breaking changes', function() {
            var msg = GitParser.parseRawCommit(
                'Sat Feb 6 12:04:15 2016\n' +
                '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
                'feat(ng-list): Allow custom separator\n' +
                'bla bla bla\n\n' +
                'BREAKING CHANGE: first breaking change\nsomething else\n' +
                'another line with more info\n');

            expect(msg.breaking).toEqual(' first breaking change\nsomething else\nanother line with more info\n');
        });
    });
    
    describe('readGitLog', function () {
        beforeEach(function () {
            spyOn(PackageReader, 'getSections').andReturn([{type: 'one'}, {type: 'two'}]);
            spyOn(util, 'format').andCallThrough();
        });
        
        it('should read the git log when a tag is specified', function() {
            GitParser.readGitLog('v3.0.0');
            expect(util.format).toHaveBeenCalledWith(Constants.GIT_LOG_CMD, '^one|^two', '%cd%n%H%n%s%n%b%n==END==', 'v3.0.0');
        });

        it('should read the git log when a tag is NOT specified', function() {
            GitParser.readGitLog('NONE');
            expect(util.format).toHaveBeenCalledWith(Constants.GIT_LOG_NO_TAG_CMD, '^one|^two', '%cd%n%H%n%s%n%b%n==END==');
        });
    });
    
});