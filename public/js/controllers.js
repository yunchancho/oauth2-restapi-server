'use strict';

var module = angular.module('myApp.controllers', []);

module.controller('LoginCtrl', function($scope, $rootScope, $location, $window, authFactory, tokenFactory, redirectFactory) {
    $scope.loadingView = true;
    $scope.alertMessage = null;
    $scope.loginLocalAccount = function (credentials) {
        authFactory.save({
            action: 'login',
        }, {
            email : $scope.credentials.email,
            password : $scope.credentials.password
        }, function (response) {
            console.log('login success');
            // emit login complete
            $rootScope.$emit('required-login:success');
            // save info with token sent by node server
            console.log('_id : ' + response.data);
            tokenFactory.setToken(response.data);
            if (redirectFactory.getUrl()) {
                $location.path(redirectFactory.getUrl());
            } else {
                $location.path('/');
            }
            redirectFactory.setUrl(null);
        }, function (error) {
            console.log('login failed');
            // show error message on current page
            // e.g) $scope.error = err.message;
            $scope.alertMessage = error.data.reason;
        });
    };

    $scope.loginSocialAccount = function (socialName) {
        var url = '/auth/login/' + socialName;
        $window.open(url, 'target=_blank');
    };

    $rootScope.$on('social-login:success', function (event, data) {
        console.log('Success event Recieved');
        console.log('_id: ' + data);
        tokenFactory.setToken(data);
        if (redirectFactory.getUrl()) {
            $location.path(redirectFactory.getUrl());
        } else {
            $location.path('/');
        }
        redirectFactory.setUrl(null);
    });

    $rootScope.$on('social-login:failure', function (event, error) {
        console.log('Failure event Recieved');
        $scope.alertMessage = error.message;
    });
});

module.controller('SignupCtrl', function($scope, $location, authFactory, tokenFactory, redirectFactory) {
    $scope.alertMessage = null;
    $scope.signup = function (credentials) {
        authFactory.save({
            action: 'signup'
        }, {
            email : $scope.credentials.email,
            password : $scope.credentials.password
        }, function (response) {
            console.log('_id : ' + response.data);
            tokenFactory.setToken(response.data);
            $location.path('/profile');
        }, function (error) {
            // show error message on current page
            $scope.alertMessage = error.data.reason;
        });
    };

    $scope.signupForConnect = function (credentials) {
        authFactory.save({
            action: 'connect',
            social: 'local'
        }, {
            email : $scope.credentials.email,
            password : $scope.credentials.password
        }, function (response) {
            // save info with token sent by node server
            console.log('_id : ' + response.data);
            tokenFactory.setToken(response.data);
            $location.path('/profile');
        }, function (error) {
            // show error message on current page
            // e.g) $scope.error = err.message;
            $scope.alertMessage = error.data.reason;
        });
    };
});

module.controller('ProfileCtrl', function($scope, $rootScope, $route, $window, $location, authFactory, tokenFactory, getProfile) {
    $scope.alertMessage = null;
    $scope.profile = getProfile;
    $scope.logout = function () {
        authFactory.get({
            action: 'logout'
        }, function () {
            tokenFactory.setToken(null);
            $location.path('/');
        });
    };

    $scope.connectLocalAccount = function () {
        $location.path('/connect');
    };

    $scope.connectSocialAccount = function (socialName) {
        var url = '/auth/connect/' + socialName;
        $window.open(url, 'target=_blank');
    };

    $scope.disconnectAccount = function (socialName) {
        authFactory.get({
            action: 'disconnect',
            social: socialName
        }, function (data) {
            console.log('disconnect callback: ' + data);
            tokenFactory.setToken(data);
            // reload current route for fetching updated profile
            $route.reload();
        });
    };

    $rootScope.$on('social-login:success', function (event, data) {
        console.log('Success event Recieved');
        tokenFactory.setToken(data);
        // reload current route for fetching updated profile
        $route.reload();
    });

    $rootScope.$on('social-login:failure', function (event, error) {
        console.log('Failure event Recieved');
        $scope.alertMessage = error.message;
    });
});
