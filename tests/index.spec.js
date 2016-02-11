'use strict';

var expect = require('chai').expect,
    changelog = require('../index');

describe('changelog.js', function() {

    describe('currentDate', function () {
        it('should get the current date', function() {
            expect(changelog.currentDate(false, new Date(2016, 1, 5))).to.be.eql('2016-02-05');
        });

        it('should get current date with hours and minutes', function() {
            expect(changelog.currentDate(true, new Date(2016, 1, 10, 21, 30))).to.be.eql('2016-02-10 21:30');
        });
    });

    describe('getFileName', function () {
        it('should get BUILDLOG.md as file name', function() {
            expect(changelog.getFileName(true)).to.be.eql('BUILDLOG.md');
        });

        it('should get CHANGELOG.md as file name', function() {
            expect(changelog.getFileName()).to.be.eql('CHANGELOG.md');
        });
    });

    describe('getIssueUrl', function () {
        it('should return empty string if no package.json', function() {
            expect(changelog.getIssueUrl()).to.be.eql('');
        });

        it('should return empty string if package.json has no bugs', function() {
            expect(changelog.getIssueUrl({})).to.be.eql('');
        });

        it('should return empty string if package.json has no bugs.url', function() {
            expect(changelog.getIssueUrl({"bugs": {}})).to.be.eql('');
        });

        it('should return the package.json bugs.url', function() {
            var pJson = {
                "bugs": {
                    "url": "https://github.com/dougiefresh49/ez-changelog/issues"
                }
            };
            expect(changelog.getIssueUrl(pJson)).to.be.eql('https://github.com/dougiefresh49/ez-changelog/issues');
        });

    });

    describe('getLastBuildDate', function () {
        it('should get last build if no build log supplied', function() {
            expect(changelog.getLastBuildDate()).to.be.eql(undefined);
        });

        it('should get last build log from existing log', function() {
            var oldLog =
                '<a name="ez-changelog-v1.0.0.SNAPSHOT"></a>\n' +
                '# ez-changelog-v1.0.0.SNAPSHOT (2016-02-10 23:50)\n' +
                '## Breaking Changes\n';
            expect(changelog.getLastBuildDate(oldLog)).to.be.eql(new Date('2016-02-10 23:50'));
        });
    });

    describe('getPreviousChangelog', function () {
        it('should get empty string when no previous changelog ', function() {
            changelog.getPreviousChangelog('').then(function (prevChangeLog) {
                expect(prevChangeLog).to.be.eql('');
            });
        });

        // TODO: prob need to test if there is an existing file
        // would create fake file, write blah to it, call getPreviousChangelog, then delete the file
    });

    describe('getRepoUrl', function () {
        it('should return empty string if no package.json', function() {
            expect(changelog.getRepoUrl()).to.be.eql('');
        });

        it('should return empty string if package.json has no repo', function() {
            expect(changelog.getRepoUrl({})).to.be.eql('');
        });

        it('should return empty string if package.json has no repo.url', function() {
            expect(changelog.getRepoUrl({"repository": {}})).to.be.eql('');
        });

        it('should remove \/browse from repo url', function() {
            var pJson = {
                "repository": {
                    "url": "https://bitbucket.org/usr/repo/browse"
                }
            };
            expect(changelog.getRepoUrl(pJson)).to.be.eql('https://bitbucket.org/usr/repo/commits');
        });

        it('should add \/commit to github url', function() {
            var pJson = {
                "repository": {
                    "url": "https://github.com/angular/angular.js"
                }
            };
            expect(changelog.getRepoUrl(pJson)).to.be.eql('https://github.com/angular/angular.js/commit');
        });

        it('should add \/commits to bitbucket url', function() {
            var pJson = {
                "repository": {
                    "url": "https://bitbucket.org/usr/repo/browse"
                }
            };
            expect(changelog.getRepoUrl(pJson)).to.be.eql('https://bitbucket.org/usr/repo/commits');
        });
    });

    describe('getSectionsFomCommits', function () {
        it('should get default sections for no commits', function() {
            var sections = changelog.getSectionsFomCommits([]);
            expect(sections.fix).to.be.eql({});
            expect(sections.feat).to.be.eql({});
            expect(sections.perf).to.be.eql({});
            expect(sections.breaks).to.be.eql({'$$' : []});
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
            expect(sections.fix.changelog.length).to.be.eql(1);
            expect(sections.fix.changelog[0].hash).to.be.eql('265d635cef8bdc16c286477beb948fd11e85bfc1');

            expect(sections.feat.readme.length).to.be.eql(1);
            expect(sections.feat.readme[0].hash).to.be.eql('298cffa6a7a36bcde5650323b5d6d0f6cec065e8');
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
            expect(sections.fix.changelog.length).to.be.eql(1);
            expect(sections.fix.changelog[0].hash).to.be.eql('265d635cef8bdc16c286477beb948fd11e85bfc1');

            expect(sections.feat.readme.length).to.be.eql(1);
            expect(sections.feat.readme[0].hash).to.be.eql('298cffa6a7a36bcde5650323b5d6d0f6cec065e8');

            expect(sections.breaks['node executable']).to.be.eql(undefined);
        });
    });

    describe('getUpdatedVersionName', function () {
        it('should get default changelog tag', function() {
            expect(changelog.getUpdatedVersionName(false, 'v1.2.0', '', {})).to.be.eql('v1.2.0');
        });

        it('should get default buildlog tag with no package.json', function() {
            expect(changelog.getUpdatedVersionName(true, 'v1.2.0', '')).to.be.eql('v1.2.0');
        });

        it('should get default buildlog tag with no package.json name field', function() {
            expect(changelog.getUpdatedVersionName(true, 'v1.2.0', '', {})).to.be.eql('v1.2.0');
        });

        it('should get buildlog tag with package.json name defined', function() {
            expect(changelog.getUpdatedVersionName(true, 'v1.2.0', '33', {name: 'ez-changelog'})).to.be.eql('ez-changelog-v1.2.0.33');
        });
    });

    describe('isCallFromMocha', function () {
        it('should say call is from mocha', function() {
            expect(changelog.isCallFromMocha('some/file/path/mocha/')).to.be.eql(true);
        });

        it('should say call is not from mocha', function() {
            expect(changelog.isCallFromMocha('--incremental')).to.be.eql(false);
        });
    });

    describe('linkToCommit', function () {
        it('should create a link to a commit', function() {
            expect(changelog.linkToCommit('992faac888d81a8f18c8646be2a2b07eb36feed7')).to.be.eql('[992faac8](https://github.com/dougiefresh49/ez-changelog/commit/992faac888d81a8f18c8646be2a2b07eb36feed7)');
        });
    });

    describe('linkToIssue', function () {
        it('should create a link to an issue', function() {
            expect(changelog.linkToIssue('333')).to.be.eql('[#333](https://github.com/dougiefresh49/ez-changelog/issues/333)');
        });
    });

    describe('parseRawCommit', function() {
        it('should parse raw commit', function() {
            var msg = changelog.parseRawCommit(
                'Sat Feb 6 12:04:15 2016\n' +
                '9b1aff905b638aa274a5fc8f88662df446d374bd\n' +
                'feat(scope): broadcast $destroy event on scope destruction\n' +
                'perf testing shows that in chrome this change adds 5-15% overhead\n' +
                'when destroying 10k nested scopes where each scope has a $destroy listener\n');

            expect(msg.date).to.be.eql(new Date('Sat Feb 6 12:04:15 2016'));
            expect(msg.type).to.be.eql('feat');
            expect(msg.hash).to.be.eql('9b1aff905b638aa274a5fc8f88662df446d374bd');
            expect(msg.subject).to.be.eql('broadcast $destroy event on scope destruction');
            expect(msg.body).to.be.eql('perf testing shows that in chrome this change adds 5-15% overhead\n' +
                'when destroying 10k nested scopes where each scope has a $destroy listener\n');
            expect(msg.component).to.be.eql('scope');
        });

        it('should parse closed issues', function() {
            var msg = changelog.parseRawCommit(
                'Sat Feb 6 12:04:15 2016\n' +
                '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
                'feat(ng-list): Allow custom separator\n' +
                'bla bla bla\n\n' +
                'Closes #123\nCloses #25\n');

            expect(msg.closes).to.be.eql([123, 25]);
        });

        it('should parse breaking changes', function() {
            var msg = changelog.parseRawCommit(
                'Sat Feb 6 12:04:15 2016\n' +
                '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
                'feat(ng-list): Allow custom separator\n' +
                'bla bla bla\n\n' +
                'BREAKING CHANGE: first breaking change\nsomething else\n' +
                'another line with more info\n');

            expect(msg.breaking).to.be.eql(' first breaking change\nsomething else\nanother line with more info\n');
        });
    });

    describe('printSection', function() {
        var output;
        var streamMock = {
            write: function(str) {
                output += str;
            }
        };

        beforeEach(function() {
            output = '';
        });

        it('should add a new line at the end of each breaking change list item ' +
            'when there is 1 item per component', function() {
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

            changelog.printSection(streamMock, title, section, printCommitLinks);
            expect(output).to.be.eql(expectedOutput);
        });

        it('should add a new line at the end of each breaking change list item ' +
            'when there are multiple items per component', function() {
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

            changelog.printSection(streamMock, title, section, printCommitLinks);
            expect(output).to.be.eql(expectedOutput);
        });

        it('should print commit links', function() {
            var title = 'test',
                printCommitLinks = true;

            var section = {
                changelog: [
                    {
                        hash: "265d635cef8bdc16c286477beb948fd11e85bfc1",
                        "closes": [],
                        subject: 'add ability to append to top of existing changelog vs bottom'
                    }
                ],
                readme: [{
                    hash: "298cffa6a7a36bcde5650323b5d6d0f6cec065e8",
                    "closes": [],
                    subject: 'add initial readmen with examples and usage'
                }]
            };

            var expectedOutput =
                '\n' + '## test\n\n' +
                '- **changelog:** add ability to append to top of existing changelog vs bottom\n' +
                '  ([265d635c](https://github.com/dougiefresh49/ez-changelog/commit/265d635cef8bdc16c286477beb948fd11e85bfc1))\n' +
                '- **readme:** add initial readmen with examples and usage\n' +
                '  ([298cffa6](https://github.com/dougiefresh49/ez-changelog/commit/298cffa6a7a36bcde5650323b5d6d0f6cec065e8))\n\n';

            changelog.printSection(streamMock, title, section, printCommitLinks);
            expect(output).to.be.eql(expectedOutput);

        });
    });

    describe('writeChangelog', function () {
        var output;
        var streamMock = {
            write: function(str) {
                output += str;
            }
        };

        var sections = {
            "fix": {},
            "feat": {
                "changelog": [{
                    "hash": "265d635cef8bdc16c286477beb948fd11e85bfc1",
                    "subject": "add ability to append to top of existing changelog vs bottom",
                    "closes": [],
                    "breaks": [],
                    "body": "",
                    "type": "feat",
                    "component": "changelog"
                }],
                "readme": [{
                    "hash": "298cffa6a7a36bcde5650323b5d6d0f6cec065e8",
                    "subject": "add initial readmen with examples and usage",
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
        });

        it('should write to changelog', function() {
            var currentDate = changelog.currentDate();
            var expectedOutput =
                '<a name="vTest"></a>\n' +
                '# vTest (' + currentDate + ')\n' +
                '\n' +
                '\n' +
                '## Features\n\n' +
                '- **changelog:** add ability to append to top of existing changelog vs bottom\n' +
                '  ([265d635c](https://github.com/dougiefresh49/ez-changelog/commit/265d635cef8bdc16c286477beb948fd11e85bfc1))\n' +
                '- **readme:** add initial readmen with examples and usage\n' +
                '  ([298cffa6](https://github.com/dougiefresh49/ez-changelog/commit/298cffa6a7a36bcde5650323b5d6d0f6cec065e8))\n\n';

            changelog.writeChangelog(streamMock, sections, 'vTest');
            expect(output).to.be.eql(expectedOutput);
        });
    });
});