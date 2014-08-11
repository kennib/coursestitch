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
    .when('/map/:mapId/:mapTitle', {
        templateUrl: '/templates/map.html',
        controller: 'MapCtrl',
    })
    .when('/map/:mapId/:mapTitle/:viewType/:viewId/:viewTitle/:viewSubtitle?', {
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

service('makeURL', function(urlizeFilter) {
    // Create a URL string from various attributes of a given map
    // and view object (which can be a resource or a concept).
    // The return string should match the URL format given in
    // the routeProvider above.
    return function(mapObject, viewObject) {
        var fields = [
            mapObject.id,
            urlizeFilter(mapObject.attributes.title)
        ];
        if (viewObject) {
            fields = fields.concat([   
                viewObject.className.toLowerCase(),
                viewObject.id,
                urlizeFilter(viewObject.attributes.title),
                urlizeFilter(viewObject.attributes.subtitle)
            ]);
        }
        return '#!/map/' + fields.join('/');
    };
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
filter('understandingClass', function() {
    return function(u) {
        if (u < 0) {
            return 'palette-pomegranate';
        } else if (u == 0) {
            return 'palette-silver';
        } else if (u > 0 && u < 0.5) {
            return 'palette-peter-river';
        } else if (u > 0.5 && u < 1) {
            return 'palette-turquoise';
        } else if (u == 1) {
            return 'palette-emerald';
        }
    };
}).
filter('understandingLabel', function() {
    return function(u) {
        if (u < 0) {
            return 'Confusing';
        } else if (u == 0) {
            return 'Unread';
        } else if (u > 0 && u < 0.5) {
            return 'Getting started';
        } else if (u > 0.5 && u < 1) {
            return 'Almost finished';
        } else if (u == 1) {
            return 'Understood';
        }
    };
}).


controller('RootCtrl', function($scope, makeURL) {
    $scope.makeURL = makeURL;
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
