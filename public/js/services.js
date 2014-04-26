'use strict';

var module = angular.module('myApp.services', ['ngResource']);

module.value('version', '0.1');

module.factory('authFactory', function ($resource) {
    return $resource('/auth/:action/:social', {
        action: '@action',
        social: '@social'
    });
});

module.factory('profileFactory', function ($resource, $q, tokenFactory) {
    var functions = {
        getProfile: function () {
              // check if token exists, or not.
              // if not, current route is stopped!
              if (!tokenFactory.isAuthenticated()) {
                  return tokenFactory.stopRouting();
              }
              
              var promise = $resource('/profile').get().$promise;
              promise.then(
                  function(profile) {
                    console.log('resolver success');
                    return profile;
                  },
                  function(error) {
                    console.log('resolver error:' + error);
              });
              return promise;
        }
    };

    return functions;
});

module.factory('httpRequestInterceptor', function($q, $location) {
    var interceptor = {
        'request': function (config) {
            // when token based login is used,
            // add the token to 'Authentication' of http header 
            console.log(config);
            return config || $q.when(config);
        },
        'requestError': function (rejection) {
            // if needed, recovery logic can be here
            return $q.reject(rejection);
        }
    };
    return interceptor;
});

module.factory('httpResponseInterceptor', function($q, $injector, $location, tokenFactory) {
    var interceptor = {
        'response': function (response) {
            console.log(response);
            return response;
        },
        'responseError': function(response) { 
            console.log('response error:' + response);
            if (response.status == 401 &&
                response.data.reason == 'not-authenticated') {

                // TODO why injector should used here? infinite loop?
                var $http = $injector.get('$http');
                var deferred = $q.defer();
                
                // get authentication
                tokenFactory.authenticate().then(
                        deferred.resolve, deferred.reject);

                return deferred.promise.then(function () {
                    return $http(response.config);
                });
            }

            // if you want to propagate error, call $q.reject() 
            return $q.reject(response);
        }
    };
    return interceptor;
});

module.factory('tokenFactory', function ($rootScope, $q, $location, $timeout, redirectFactory) {
    var authToken;
    return {
        setToken: function (token) {
            authToken = token;
        },
        getToken: function () {
            return authToken;
        },
        isAuthenticated: function () {
            if (!authToken) {
                return false;
            }
            return true;
        },
        authenticate: function () {
            var deferred = $q.defer();
            $rootScope.$on('required-login:success', function () {
                console.log('required-login:success is fired!');
                // this makes promise of responseError interceptor resolved
                deferred.resolve();
            });
            $rootScope.$on('required-login:failure', function () {
                // this makes promise of responseError interceptor resolved
                deferred.reject();
            });
            // go to login route
            redirectFactory.setUrl($location.path());
            $location.path('/login');
            return deferred.promise;
        },
        stopRouting: function () {
            var defer = $q.defer();
            $timeout(function () {
                defer.reject();
            }, 0);
            return defer.promise;
        }
    };
});

module.factory('redirectFactory', function () {
    var redirectUrl;
    var functions = {
        setUrl: function (url) {
            redirectUrl = url;
        },
        getUrl: function () {
            return redirectUrl;
        }
    };
    return functions;
});
