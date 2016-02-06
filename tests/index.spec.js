'use strict';

var expect = require('chai').expect,
    changelog = require('../index');

describe('changelog.js', function() {

    describe('parseRawCommit', function() {
        it('should parse raw commit', function() {
            var msg = changelog.parseRawCommit(
                '9b1aff905b638aa274a5fc8f88662df446d374bd\n' +
                'feat(scope): broadcast $destroy event on scope destruction\n' +
                'perf testing shows that in chrome this change adds 5-15% overhead\n' +
                'when destroying 10k nested scopes where each scope has a $destroy listener\n');

            expect(msg.type).to.be.eql('feat');
            expect(msg.hash).to.be.eql('9b1aff905b638aa274a5fc8f88662df446d374bd');
            expect(msg.subject).to.be.eql('broadcast $destroy event on scope destruction');
            expect(msg.body).to.be.eql('perf testing shows that in chrome this change adds 5-15% overhead\n' +
                'when destroying 10k nested scopes where each scope has a $destroy listener\n');
            expect(msg.component).to.be.eql('scope');
        });

        it('should parse closed issues', function() {
            var msg = changelog.parseRawCommit(
                '13f31602f396bc269076ab4d389cfd8ca94b20ba\n' +
                'feat(ng-list): Allow custom separator\n' +
                'bla bla bla\n\n' +
                'Closes #123\nCloses #25\n');

            expect(msg.closes).to.be.eql([123, 25]);
        });

        it('should parse breaking changes', function() {
            var msg = changelog.parseRawCommit(
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

    describe('linkToIssue', function () {
        it('should create a link to an issue', function() {
            expect(changelog.linkToIssue('333')).to.be.eql('[#333](https://github.com/dougiefresh49/ez-changelog/issues/333)');
        });
    });

    describe('linkToCommit', function () {
        it('should create a link to a commit', function() {
            expect(changelog.linkToCommit('992faac888d81a8f18c8646be2a2b07eb36feed7')).to.be.eql('[992faac8](https://github.com/dougiefresh49/ez-changelog/commit/992faac888d81a8f18c8646be2a2b07eb36feed7)');
        });
    });

    describe('currentDate', function () {
        it('should get the current date', function() {
            expect(changelog.currentDate(new Date(2016, 1, 5))).to.be.eql('2016-02-05');
        });
    });
});