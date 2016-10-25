'use strict';

var fs = require('fs'),
    findup = require('findup'),
    packageReader = require('../src/package-reader');


describe('package-reader', function () {
    
    beforeEach(function () {
        spyOn(console, 'log');
    });

    describe('getPackage', function () {

        beforeEach(function () {
            spyOn(findup, 'sync').andCallThrough();
        });
        
        it('should load, save and return the package.json if it exists', function() {
            spyOn(fs, 'readFileSync').andReturn("{}");
            var pkg = packageReader.getPackage(true);
            expect(findup.sync).toHaveBeenCalled();
            expect(pkg).toEqual({});
        });
        
        it('should return the previously fetched package object on second call', function() {
            spyOn(fs, 'readFileSync');
            packageReader.getPackage();
            
            expect(findup.sync).not.toHaveBeenCalled();
            expect(fs.readFileSync).not.toHaveBeenCalled();
        });

    });

    describe('getConfig', function () {

        it('should return the ez-changelog config if it exists', function() {
            var fakePackageConfig = {
                'config': {'ez-changelog': {'some': 'stuff' }}
            };
            spyOn(fs, 'readFileSync').andReturn(JSON.stringify(fakePackageConfig));
            packageReader.getPackage(true);
            expect(packageReader.getConfig()).toEqual({'some': 'stuff'});
        });

        it('should return an empty object and log there is no config', function() {
            spyOn(fs, 'readFileSync').andReturn("{}");
            packageReader.getPackage(true);
            expect(packageReader.getConfig()).toEqual({});
            expect(console.log).toHaveBeenCalledWith('[ez-changelog] WARNING: no config specified in package.json, using defaults')
        });

    });
    
    describe('getIssueUrl', function () {
        
        it('should return empty string if no url specified', function() {
            spyOn(fs, 'readFileSync').andReturn("{}");
            packageReader.getPackage(true);
            expect(packageReader.getIssueUrl()).toEqual('');
            expect(console.log).toHaveBeenCalledWith('[ez-changelog] WARNING: no bugs url specified in package.json')
        });

        it('should return the bugs url if specified', function() {
            var fakePackage = {
                'bugs': {'url': 'some.url'}
            };
            spyOn(fs, 'readFileSync').andReturn(JSON.stringify(fakePackage));
            packageReader.getPackage(true);
            expect(packageReader.getIssueUrl()).toEqual('some.url');
        });
        
    });

    describe('getRepoUrl', function () {

        it('should return empty string if no url specified ', function() {
            spyOn(fs, 'readFileSync').andReturn("{}");
            packageReader.getPackage(true);
            expect(packageReader.getRepoUrl()).toEqual('');
            expect(console.log).toHaveBeenCalledWith('[ez-changelog] WARNING: no repository specified in package.json')
        });

        it('should return url without browse', function() {
            var fakePackage = {
                'repository': {'url': 'some.url/browse'}
            };
            spyOn(fs, 'readFileSync').andReturn(JSON.stringify(fakePackage));
            packageReader.getPackage(true);
            expect(packageReader.getRepoUrl()).toEqual('some.url/commits');
        });

        it('should return github formatted url', function() {
            var fakePackage = {
                'repository': {'url': 'github.com/some-repo'}
            };
            spyOn(fs, 'readFileSync').andReturn(JSON.stringify(fakePackage));
            packageReader.getPackage(true);
            expect(packageReader.getRepoUrl()).toEqual('github.com/some-repo/commit');
        });

        it('should return bitbucket formatted url', function() {
            var fakePackage = {
                'repository': {'url': 'bitbucket.com/some-repo'}
            };
            spyOn(fs, 'readFileSync').andReturn(JSON.stringify(fakePackage));
            packageReader.getPackage(true);
            expect(packageReader.getRepoUrl()).toEqual('bitbucket.com/some-repo/commits');
        });
        
    });

    describe('getSectionDetails', function () {
        it('should return the default sections details if none provided', function() {
            spyOn(fs, 'readFileSync').andReturn("{}");
            packageReader.getPackage(true);
            var sectionDetails = packageReader.getSectionDetails();
            expect(Object.keys(sectionDetails).length).toBe(4);
        });

        it('should return the custom sections details provided in package.json config', function() {
            var fakePackage = {
                'config': {'ez-changelog': {
                    'overrideDefaults': true,
                    'sections': [ {'type': 'thing1', 'title': 'THING 1'}, {'type': 'thing2', 'title': 'THING 2'} ]
                }}
            };
            spyOn(fs, 'readFileSync').andReturn(JSON.stringify(fakePackage));
            packageReader.getPackage(true);
            var sectionDetails = packageReader.getSectionDetails();
            expect(Object.keys(sectionDetails).length).toBe(2);
            expect(sectionDetails.thing1).toEqual({title: 'THING 1', 'printCommitLinks': undefined});
            expect(sectionDetails.thing2).toEqual({title: 'THING 2', 'printCommitLinks': undefined});
        });

        it('should return the custom sections details from config combined with defaults', function() {
            var fakePackage = {
                'config': {'ez-changelog': {
                    'overrideDefaults': false,
                    'sections': [ {'type': 'thing1', 'title': 'THING 1'}, {'type': 'thing2', 'title': 'THING 2'} ]
                }}
            };
            spyOn(fs, 'readFileSync').andReturn(JSON.stringify(fakePackage));
            packageReader.getPackage(true);
            var sectionDetails = packageReader.getSectionDetails();
            expect(Object.keys(sectionDetails).length).toBe(6);
            expect(sectionDetails.thing1).toEqual({title: 'THING 1', 'printCommitLinks': undefined});
            expect(sectionDetails.thing2).toEqual({title: 'THING 2', 'printCommitLinks': undefined});
        });
    });
    
    describe('getSectionsMap', function () {
        it('should return the default sections map if none provided', function() {
            spyOn(fs, 'readFileSync').andReturn("{}");
            packageReader.getPackage(true);
            var sectionMap = packageReader.getSectionsMap();
            expect(Object.keys(sectionMap).length).toBe(4);
        });

        it('should return the custom sections map provided in package.json config', function() {
            var fakePackage = {
                'config': {'ez-changelog': {
                    'overrideDefaults': true,
                    'sections': [ {'type': 'thing1'}, {'type': 'thing2'} ]
                }}
            };
            spyOn(fs, 'readFileSync').andReturn(JSON.stringify(fakePackage));
            packageReader.getPackage(true);
            var sectionMap = packageReader.getSectionsMap();
            expect(Object.keys(sectionMap).length).toBe(2);
            expect(sectionMap.thing1).toEqual({});
            expect(sectionMap.thing2).toEqual({});
        });

        it('should return the custom sections map from config combined with defaults', function() {
            var fakePackage = {
                'config': {'ez-changelog': {
                    'overrideDefaults': false,
                    'sections': [ {'type': 'thing1'}, {'type': 'thing2'} ]
                }}
            };
            spyOn(fs, 'readFileSync').andReturn(JSON.stringify(fakePackage));
            packageReader.getPackage(true);
            var sectionMap = packageReader.getSectionsMap();
            expect(Object.keys(sectionMap).length).toBe(6);
            expect(sectionMap.thing1).toEqual({});
            expect(sectionMap.thing2).toEqual({});
        });
    });
    
    describe('getUpdatedVersionName', function () {
        it('should get default changelog tag', function() {
            expect(packageReader.getUpdatedVersionName(false, 'v1.2.0', '')).toEqual('v1.2.0');
        });

        it('should get default buildlog tag with no package.json', function() {
            expect(packageReader.getUpdatedVersionName(true, 'v1.2.0', '')).toEqual('v1.2.0');
        });
        
        it('should get buildlog tag with package.json name defined', function() {
            var fakePackage = {
                'name': 'ez-changelog'
            };
            spyOn(fs, 'readFileSync').andReturn(JSON.stringify(fakePackage));
            packageReader.getPackage(true);
            expect(packageReader.getUpdatedVersionName(true, 'v1.2.0', '33')).toEqual('ez-changelog-v1.2.0.33');
        });

        it('should get changelog tag with package.json name defined', function() {
            var fakePackage = {
                'name': 'ez-changelog'
            };
            spyOn(fs, 'readFileSync').andReturn(JSON.stringify(fakePackage));
            packageReader.getPackage(true);
            expect(packageReader.getUpdatedVersionName(false, 'v1.2.0', '')).toEqual('v1.2.0');
        });
    });
});