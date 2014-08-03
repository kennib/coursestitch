angular.module('coursestitch', [
    'ngRoute', 'parse-angular',
    'coursestitch-maps', 'coursestitch-resources',
    'coursestitch-components'
]).

config(function($routeProvider, $locationProvider) {
    $routeProvider
    .when('/', {
        templateUrl: '/templates/home.html',
    })
    .when('/maps', {
        templateUrl: '/templates/maps.html',
        controller: 'MapsCtrl',
    })
    .when('/map/:mapTitle', {
        templateUrl: '/templates/map.html',
        controller: 'MapCtrl',
    })
    .when('/map/:mapTitle/concept/:conceptTitle', {
        templateUrl: '/templates/map.html',
        controller: 'MapCtrl',
    })
    .when('/map/:mapTitle/resource/:resourceTitle/:resourceSubtitle', {
        templateUrl: '/templates/map.html',
        controller: 'MapCtrl',
    });

    $locationProvider
        .html5Mode(false)
        .hashPrefix('!');
}).
config(function() {
    var parseKeys = {
        app: 'QrE6nn4lKuwE9Mon6CcxH7nLQa6eScKwBgqh5oTH',
        js: 'NO1PZLeyugXkKDfDPuL8wAINf0356iTWiCVaTfGJ',
    };

    Parse.initialize(parseKeys.app, parseKeys.js);
}).

filter('urlize', function() {
    return function(string) {
        if (string)
            return string.replace(/ /g, '-');
    };
}).

filter('deurlize', function() {
    return function(string) {
        if (string)
            return string.replace(/-/g, ' ');
    };
}).

controller('LoginCtrl', function($scope) {
    if (Parse.User.current()) {
        $scope.loggedIn = true;
        $scope.user = Parse.User.current().attributes;
    } else {
        $scope.loggedIn = false;
    }

    $scope.login = function() {
        Parse.User.logIn($scope.email, $scope.password)
        .then(function(user) {
            $scope.loggedIn = true;
            $scope.user = user.attributes;
        })
        .fail(function(error) {
            $scope.loggedIn = false;
            $scope.error = error;
        });
    };
});
