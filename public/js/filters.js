'use strict';

/* Filters */

var module = angular.module('myApp.filters', []);

module.filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]
);

module.filter('reverse', function () {
    return function (items) {
        return items.slice().reverse();
    };
});
