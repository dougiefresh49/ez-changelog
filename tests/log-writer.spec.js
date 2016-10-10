'use strict';

var logWriter = require('../src/log-writer'),
    helpers = require('../src/helpers'),
    packageReader = require('../src/package-reader');

var output;
var streamMock = {
    write: function(str) {
        output += str;
    }
};

describe('log-writer', function () {
    describe('isEmptySection', function () {
        it('should say section is empty', function() {
            expect(logWriter.isEmptySection([])).toBeTruthy();
        });

        it('should say section is empty for empty breaking change', function() {
            expect(logWriter.isEmptySection(['$$'])).toBeTruthy();
        });

        it('should say section is not empty if not for breaking change', function() {
            expect(logWriter.isEmptySection(['feature1', 'feature2'])).toBeFalsy();
        });
    });
    
    describe('linkToCommit', function () {
        it('should return an empty string if no hash provided', function() {
            expect(logWriter.linkToCommit()).toEqual('');
        });
        
        it('should return a proper link to a commit', function() {
            spyOn(packageReader, 'getRepoUrl').andReturn('some/repo/url/commit');
            expect(logWriter.linkToCommit('992faac888d81a8f18c8646be2a2b07eb36feed7')).toEqual('[992faac8](some/repo/url/commit/992faac888d81a8f18c8646be2a2b07eb36feed7)');
        });
    });
    
    describe('linkToIssue', function () {
        it('should return a link to an issue', function() {
            spyOn(packageReader, 'getIssueUrl').andReturn('some/repo/url/issues');
            expect(logWriter.linkToIssue('333')).toEqual('[#333](some/repo/url/issues/333)');
        });
    });

    describe('printCommits', function () {
        beforeEach(function() {
            output = '';
            spyOn(packageReader, 'getRepoUrl').andReturn('some/repo/url/commit');
            spyOn(packageReader, 'getIssueUrl').andReturn('some/repo/url/issues');
        });

        it('should print the commits with no commit links', function() {
            var commits = [
                {subject: 'some subject 1.1'},
                {subject: 'some subject 1.2'}
            ];
            var expectedOutput = 
                '- some subject 1.1\n' +
                '- some subject 1.2\n';
            
            logWriter.printCommits(streamMock, commits, '-', false);
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
            logWriter.printCommits(streamMock, commits, '-', true);
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
            
            logWriter.printCommits(streamMock, commits, '-', true);
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

            logWriter.printSection(streamMock, title, section, printCommitLinks);
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

            logWriter.printSection(streamMock, title, section, printCommitLinks);
            expect(output).toEqual(expectedOutput);
        });

    });

    describe('writeChangelog', function () {
        var sections = {
            "fix": {},
            "feat": {
                "changelog": [{
                    "hash": "265d635cef8bdc16c286477beb948fd11e85bfc1",
                    "subject": "add some fancy ability",
                    "closes": [],
                    "breaks": [],
                    "body": "",
                    "type": "feat",
                    "component": "changelog"
                }],
                "readme": [{
                    "hash": "298cffa6a7a36bcde5650323b5d6d0f6cec065e8",
                    "subject": "add initial ability",
                    "closes": [],
                    "breaks": [],
                    "body": "",
                    "type": "feat",
                    "component": "readme"
                }]
            },
            "perf": {},
            "breaks": {}
        };

        beforeEach(function() {
            output = '';
            spyOn(packageReader, 'getRepoUrl').andReturn('some/repo/url/commit');
            spyOn(helpers, 'getCurrentDate').andReturn('10-09-2016');
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

            logWriter.writeChangelog(streamMock, sections, 'vTest', false);
            expect(output).toEqual(expectedOutput);
        });

        it('should write "no new commits" to log', function() {
            var expectedOutput =
                '<a name="vTest"></a>\n' +
                '# vTest (10-09-2016)\n\n' +
                '### Nothing important to note\n\n';

            logWriter.writeChangelog(streamMock, sections, 'vTest', true);
            expect(output).toEqual(expectedOutput);
        });
    });
    
});