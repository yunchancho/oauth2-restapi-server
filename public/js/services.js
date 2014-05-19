'use strict';

var module = angular.module('myApp.services', ['ngResource']);

module.value('version', '0.1');

module.factory('authFactory', function ($resource) {
    return $resource('/auth/:action/:social', {
        action: '@action',
        social: '@social'
    });
});

module.factory('oauth2serverFactory', function ($resource, tokenFactory) {
    var oauth2 = $resource('/oauth2/token', null, {
        post: {
            method: 'POST',
            isArray: false,
            headers: {
                // This is used for authenticate this client by 
                // authorization server
                'Authorization' : 'Basic dEVZUUFGaUFBbUxyUzJEbDpZbUUyTFlUR0t1bmxWVzVPcktObFdGOUtRWlVaT0hEeQ=='
            }
        },
        destroy: {
            method: 'DELETE',
            isArray: false
        }
    });
    return oauth2;
});

module.factory('profileFactory', function ($resource, $q, tokenFactory) {
    var url = '/api/profile';
    var functions = {
        getProfileResolver: function () {
              // check if token exists, or not.
              // if not, current route is stopped!
              if (!tokenFactory.isAuthenticated()) {
                  return tokenFactory.stopRouting();
              }
              var promise = $resource(url).get().$promise;
              promise.then(
                  function(profile) {
                    console.log('resolver success');
                    return profile;
                  },
                  function(error) {
                    console.log('resolver error:' + error);
              });
              return promise;
        },

        getProfile: function (callback) {
              // check if token exists, or not.
              // if not, current route is stopped!
              $resource(url).get(function (response) {
                  callback(response);
              });
        }
    };

    return functions;
});

module.factory('httpRequestInterceptor', function($q, $location, tokenFactory) {
    var interceptor = {
        'request': function (config) {
            console.log('-----------------');
            console.log('current url: ' + config.url);

            if (!config.headers['Authorization']) {
                // TODO we need to check if access_token is expired, or not.
                // if so, we should request refreshing access_token to server

                // add token to http header for authorization in server side
                config.headers.Authorization = 
                    'Bearer ' + tokenFactory.getToken().access_token;
            }

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
    var authToken = {};
    // watch authToken value
    // if it is changed to other value, set it to local storage
    return {
        setToken: function (token) {
            authToken = token;
        },
        getToken: function () {
            return authToken;
        },
        isAuthenticated: function () {
            if (!authToken.access_token) {
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
