'use strict';

var helpers = require('../src/helpers');

describe('helpers', function () {
    
    describe('getCurrentDate', function () {
        it('should get the current date with proper padding', function() {
            expect(helpers.getCurrentDate(false, new Date(2016, 9, 8))).toEqual('2016-10-08');
        });

        it('should get the current date when incremental flag is true', function() {
            expect(helpers.getCurrentDate(true, new Date(2016, 9, 8, 21, 30))).toEqual('2016-10-08 21:30');
        });
    });

    describe('getLastBuildDate', function () {
        it('should get last build if no build log supplied', function() {
            expect(helpers.getLastBuildDate()).toEqual(undefined);
        });

        it('should get last build log from existing log', function() {
            var oldLog =
                '<a name="ez-changelog-v1.0.0.SNAPSHOT"></a>\n' +
                '# ez-changelog-v1.0.0.SNAPSHOT (2016-02-10 23:50)\n' +
                '## Breaking Changes\n';
            expect(helpers.getLastBuildDate(oldLog)).toEqual(new Date('2016-02-10 23:50'));
        });
    });

    describe('isCallFromJasmine', function () {
        it('should say call is from jasmine-node', function() {
            expect(helpers.isCallFromJasmine('some/file/path/jasmine-node/')).toEqual(true);
        });

        it('should say call is not from jasmine-node', function() {
            expect(helpers.isCallFromJasmine('--incremental')).toEqual(false);
        });
    });
    
});