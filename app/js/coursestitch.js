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
            fields.concat(
            [   
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
