angular.module('coursestitch', ['ngRoute', 'angularParse']).

value('map', {
    title: "Learn to program",
    resources: [{
        title: "Angry Birds Hour of Code",
        subtitle: "Level 1",
        url: "http://learn.code.org/hoc/1",
        image: "http://learn.code.org/blockly/media/skins/birds/small_static_avatar.png",
        summary: "Can you help me to catch the naughty pig? Stack a couple of \"move forward\" blocks together and press \"Run\" to help me get there.",
        teaches: ["visual programming"],
        requires: ["reading"],
    }],
}).

config(function($routeProvider, $locationProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'templates/home.html',
    })
    .when('/maps', {
        templateUrl: 'templates/maps.html',
        controller: 'MapsCtrl',
    })
    .when('/map', {
        templateUrl: 'templates/map.html',
        controller: 'ViewerCtrl',
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

controller('MapsCtrl', function($scope, parseQuery) {
    parseQuery.new('Map')
        .find()
    .then(function(maps) {
        $scope.maps = maps.map(function(o) { return o.attributes; });
        $scope.$apply();
    });
}).
controller('ViewerCtrl', function($scope, map) {
    $scope.map = map;
    $scope.resource = map.resources[0];
    $scope.tags = ["teaches", "requires"];
});
