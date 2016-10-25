'use strict';

var argv = require('yargs').argv,
    fs = require('fs'),
    LogWriter = require('../src/log-writer'),
    Helpers = require('../src/helpers'),
    PackageReader = require('../src/package-reader');

var output;
var streamMock = {
    write: function(str) {
        output += str;
    }
};

describe('log-writer', function () {
    beforeEach(function () {
        spyOn(console, 'log');
    });
    
    describe('isEmptySection', function () {
        it('should say section is empty', function() {
            expect(LogWriter.isEmptySection([])).toBeTruthy();
        });

        it('should say section is empty for empty breaking change', function() {
            expect(LogWriter.isEmptySection(['$$'])).toBeTruthy();
        });

        it('should say section is not empty if not for breaking change', function() {
            expect(LogWriter.isEmptySection(['feature1', 'feature2'])).toBeFalsy();
        });
    });
    
    describe('getSectionsFromCommits', function () {
        beforeEach(function () {
            spyOn(fs, 'readFileSync').andReturn("{}");
            spyOn(PackageReader, 'getSectionsMap').andCallThrough();
            PackageReader.getPackage(true);
        });

        it('should get default sections for no commits', function() {
            var sections = LogWriter.getSectionsFromCommits([]);
            expect(PackageReader.getSectionsMap).toHaveBeenCalled();
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

            var sections = LogWriter.getSectionsFromCommits(commits);
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

            argv.incremental = true;
            var sections = LogWriter.getSectionsFromCommits(commits, new Date('Sat Feb 5 12:04:15 2016'));
            expect(sections.fix.changelog.length).toEqual(1);
            expect(sections.fix.changelog[0].hash).toEqual('265d635cef8bdc16c286477beb948fd11e85bfc1');
            
            expect(sections.feat.readme.length).toEqual(1);
            expect(sections.feat.readme[0].hash).toEqual('298cffa6a7a36bcde5650323b5d6d0f6cec065e8');
            
            expect(sections.breaks['node executable'].length).toEqual(1);
        });
    });
    
    describe('linkToCommit', function () {
        it('should return an empty string if no hash provided', function() {
            expect(LogWriter.linkToCommit()).toEqual('');
        });
        
        it('should return a proper link to a commit', function() {
            spyOn(PackageReader, 'getRepoUrl').andReturn('some/repo/url/commit');
            expect(LogWriter.linkToCommit('992faac888d81a8f18c8646be2a2b07eb36feed7')).toEqual('[992faac8](some/repo/url/commit/992faac888d81a8f18c8646be2a2b07eb36feed7)');
        });
    });
    
    describe('linkToIssue', function () {
        it('should return a link to an issue', function() {
            spyOn(PackageReader, 'getIssueUrl').andReturn('some/repo/url/issues');
            expect(LogWriter.linkToIssue('333')).toEqual('[#333](some/repo/url/issues/333)');
        });
    });

    describe('printCommits', function () {
        beforeEach(function() {
            output = '';
            spyOn(PackageReader, 'getRepoUrl').andReturn('some/repo/url/commit');
            spyOn(PackageReader, 'getIssueUrl').andReturn('some/repo/url/issues');
        });

        it('should print the commits with no commit links', function() {
            var commits = [
                {subject: 'some subject 1.1'},
                {subject: 'some subject 1.2'}
            ];
            var expectedOutput = 
                '- some subject 1.1\n' +
                '- some subject 1.2\n';
            
            LogWriter.printCommits(streamMock, commits, '-', false);
            expect(output).toEqual(expectedOutput);
        });

        it('should print the commits with commit links', function() {
            var commits = [
                {
                    hash: "265d635cef8bdc16c286477beb948fd11e85bfc1",
                    "closes": [],
                    subject: 'some fancy subject'
                }
            ];
            var expectedOutput = '- some fancy subject\n  ([265d635c](some/repo/url/commit/265d635cef8bdc16c286477beb948fd11e85bfc1))\n';
            LogWriter.printCommits(streamMock, commits, '-', true);
            expect(output).toEqual(expectedOutput);
        });

        it('should print the commits with closes tags', function() {
            var commits = [
                {
                    hash: "265d635cef8bdc16c286477beb948fd11e85bfc1",
                    "closes": ['333'],
                    subject: 'some fancy subject'
                }
            ];
            var expectedOutput = 
                '- some fancy subject\n' +
                '  ([265d635c](some/repo/url/commit/265d635cef8bdc16c286477beb948fd11e85bfc1),\n' +
                '   [#333](some/repo/url/issues/333))\n';
            
            LogWriter.printCommits(streamMock, commits, '-', true);
            expect(output).toEqual(expectedOutput);
        });
    });

    describe('printSection', function() {
        beforeEach(function() {
            output = '';
        });

        it('should add a new line at the end of each breaking change list item with 1 item per component', function() {
            var title = 'test';
            var printCommitLinks = false;

            var section = {
                module1: [{subject: 'breaking change 1'}],
                module2: [{subject: 'breaking change 2'}]
            };
            var expectedOutput =
                '\n' + '## test\n\n' +
                '- **module1:** breaking change 1\n' +
                '- **module2:** breaking change 2\n' +
                '\n';

            LogWriter.printSection(streamMock, title, section, printCommitLinks);
            expect(output).toEqual(expectedOutput);
        });

        it('should add a new line at the end of each breaking change list item with multiple items per component', function() {
            var title = 'test';
            var printCommitLinks = false;

            var section = {
                module1: [
                    {subject: 'breaking change 1.1'},
                    {subject: 'breaking change 1.2'}
                ],
                module2: [
                    {subject: 'breaking change 2.1'},
                    {subject: 'breaking change 2.2'}
                ]
            };
            var expectedOutput =
                '\n' + '## test\n\n' +
                '- **module1:**\n' +
                '  - breaking change 1.1\n' +
                '  - breaking change 1.2\n' +
                '- **module2:**\n' +
                '  - breaking change 2.1\n' +
                '  - breaking change 2.2\n' +
                '\n';

            LogWriter.printSection(streamMock, title, section, printCommitLinks);
            expect(output).toEqual(expectedOutput);
        });

    });

    describe('writeChangelog', function () {
        beforeEach(function() {
            output = '';
            spyOn(PackageReader, 'getRepoUrl').andReturn('some/repo/url/commit');
            spyOn(PackageReader, 'getSectionDetails').andCallThrough();
            spyOn(fs, 'createWriteStream').andReturn(streamMock);
            spyOn(Helpers, 'getCurrentDate').andReturn('10-09-2016');
            PackageReader.getPackage(true);
        });

        it('should write to changelog', function() {
            var expectedOutput =
                '<a name="vTest"></a>\n' +
                '# vTest (10-09-2016)\n' +
                '\n' +
                '\n' +
                '## Features\n\n' +
                '- **changelog:** add some fancy ability\n' +
                '  ([265d635c](some/repo/url/commit/265d635cef8bdc16c286477beb948fd11e85bfc1))\n' +
                '- **readme:** add initial ability\n' +
                '  ([298cffa6](some/repo/url/commit/298cffa6a7a36bcde5650323b5d6d0f6cec065e8))\n\n';

            var commits = [
                {
                    hash: '265d635cef8bdc16c286477beb948fd11e85bfc1',
                    subject: 'add some fancy ability',
                    closes: [],
                    breaks: [],
                    body: '',
                    type: 'feat',
                    component: 'changelog'
                },
                {
                    hash: '298cffa6a7a36bcde5650323b5d6d0f6cec065e8',
                    subject: 'add initial ability',
                    closes: [],
                    breaks: [],
                    body: '',
                    type: 'feat',
                    component: 'readme'
                }
            ];
            LogWriter.writeChangelog(commits, 'CHANGELOG.md', new Date('10-09-2016'), '', 'vTest');
            expect(output).toEqual(expectedOutput);
            expect(Helpers.getCurrentDate).toHaveBeenCalled();
            expect(PackageReader.getSectionDetails).toHaveBeenCalled();
        });

        it('should write "no new commits" to log', function() {
            var expectedOutput =
                '<a name="vTest"></a>\n' +
                '# vTest (10-09-2016)\n\n' +
                '### Nothing important to note\n\n';

            LogWriter.writeChangelog([], 'BUILDLOG.md', new Date('10-09-2016'), '', 'vTest');
            expect(output).toEqual(expectedOutput);
            expect(Helpers.getCurrentDate).toHaveBeenCalled();
            expect(PackageReader.getSectionDetails).not.toHaveBeenCalled();
        });
    });
    
});