// This is a Jasmine helper function used to export results as xunit tests results.

var jasmineReporters = require('jasmine-reporters');
var SpecReporter = require('jasmine-spec-reporter').SpecReporter;

jasmine.getEnv().clearReporters();

jasmine.getEnv().addReporter(new jasmineReporters.NUnitXmlReporter({
  savePath: './',
  consolidateAll: false,
}));

jasmine.getEnv().addReporter(new SpecReporter({
  spec: {
    displayDuration: true,
  }
}));
