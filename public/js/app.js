'use strict';

// Declare app level module which depends on filters, and services
var app = angular.module('myApp', [
  'ngRoute',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers'
]);

app.config(function($routeProvider) {
      $routeProvider
      .when('/login', {
          templateUrl: 'partials/login.html',
          controller: 'LoginCtrl'
      })
      .when('/signup', {
          templateUrl: 'partials/signup.html',
          controller: 'SignupCtrl'
      })
      .when('/profile', {
          templateUrl: 'partials/profile.html',
          controller: 'ProfileCtrl',
          resolve: {
              profileRouteResolver: function (profileFactory) {
                  return profileFactory.getProfileResolver();
              }
          },
          authenticate: true
      })
      .when('/connect', {
          templateUrl: 'partials/connect.html',
          controller: 'SignupCtrl',
          authenticate: true
      })
      .otherwise({
          redirectTo: '/profile'
      });
      
      //$locationProvider.html5Mode(true);
});

app.run(function ($rootScope, $location, $window, tokenFactory, redirectFactory) {
    // check already saved access_token
    var tokenInfoString = window.localStorage.getItem('tokenInfo');
    var tokenInfo = JSON.parse(tokenInfoString) || {};
    if (tokenInfo.access_token) {
        console.log('token for this app exists');
        tokenFactory.setToken(tokenInfo);
    }

    // watch access_token for accessing resources of this app(node server)
    // if it is changed to other value, set it to local storage
    $rootScope.$watch(tokenFactory.getToken, function (newVal, oldVal, scope) {
        if (newVal !== oldVal) {
            console.log('reset access_token into localstorage');
            newVal.created = Date.now();
            window.localStorage.setItem('tokenInfo', JSON.stringify(newVal));
        }
    });

    // handle authorization for routes
    $rootScope.$on('$routeChangeStart', function (event, current, prev) {
        // check authentication
        if (current.authenticate) {
            if (!tokenFactory.isAuthenticated()) {
                console.log($location.path() + ': authentication is needed');
                redirectFactory.setUrl($location.path());
                $location.path('/login');
                // TODO is there any way to stop current routing.
                // As now, we try to stop current route in each route resolver
                return;
            }
            console.log($location.path() + ': authentication is already done');
        } else {
            console.log($location.path() + ': authentication is not needed');
        }

        // check if loading bar is needed
        if (current.$$route && current.$$route.resolve) {
            console.log('loadingView set');
            $rootScope.loadingView = true;
        }
    });

    $rootScope.$on('$routeChangeSuccess', function (event, current, prev) {
        // At this point, resolver already finished to get data from server 
        $rootScope.loadingView = false;
    });

    $rootScope.$on('$routeChangeError', function (event, current, prev) {
        // TODO error handling
        console.log('failed to change route');
    });

    // this function should be called from auth popup
    $window.authState = function (type, state, data) {
        $rootScope.$apply(function () {
            if (type == 'login') {
                if (state == 'success') {
                   $rootScope.$emit('social-login:success', data); 
                } else {
                   $rootScope.$emit('social-login:failure', data); 
                }
            } else if (type == 'connect') {
                if (state == 'success') {
                   $rootScope.$emit('social-connect:success', data);
                } else {
                   $rootScope.$emit('social-connect:failure', data); 
                }
            } else {
                console.log('wrong type');
            }
        });
    };
});

app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('httpRequestInterceptor');
    $httpProvider.interceptors.push('httpResponseInterceptor');
});

