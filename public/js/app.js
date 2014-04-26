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
              getProfile: function (profileFactory) {
                  return profileFactory.getProfile();
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
    $window.authState = function (state, data) {
        console.log(data);
        $rootScope.$apply(function () {
            if (state == 'success') {
               $rootScope.$emit('social-login:success', data); 
            } else {
               $rootScope.$emit('social-login:failure', data); 
            }
        });
    };
});

app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('httpRequestInterceptor');
    $httpProvider.interceptors.push('httpResponseInterceptor');
});

