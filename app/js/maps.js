angular.module('coursestitch-maps', [
    'parse-angular',
    'coursestitch-resources', 'coursestitch-concepts'
]).

controller('MapsCtrl', function($scope) {
    new Parse.Query('Map')
        .find()
    .then(function(maps) {
        $scope.maps = maps.map(function(o) { return o.attributes; });
        $scope.$apply();
    });
}).
controller('MapCtrl', function($scope, $routeParams, deurlizeFilter, getConcept) {
    var mapTitle = deurlizeFilter($routeParams.mapTitle);
    var conceptTitle = deurlizeFilter($routeParams.conceptTitle);
    var resourceTitle = deurlizeFilter($routeParams.resourceTitle);
    var resourceSubtitle = deurlizeFilter($routeParams.resourceSubtitle);

    if (conceptTitle) {
        $scope.viewType = 'concept';
    } else if (resourceTitle && resourceSubtitle) {
        $scope.viewType = 'resource';
    }

    new Parse.Query('Map')
        .equalTo('title', mapTitle)
        .include(['resources'])
        .first()
    .then(function(map) {
        $scope.map = map.attributes;

        if (map.get('resources')) {
            $scope.resources = map.get('resources');

            if ($scope.viewType === 'resource')
                $scope.resource = map.get('resources').filter(function(r) {
                    var hasTitle = r.attributes.title === resourceTitle;
                    var hasSubtitle = r.attributes.subtitle === resourceSubtitle;
                    return hasTitle && hasSubtitle;
                })[0];
            else if ($scope.viewType === 'concept')
                getConcept(conceptTitle)
                .then(function(concept, resources) {
                    if (concept) {
                        $scope.concept = concept.attributes;
                        $scope.concept.resources = resources;
                    }
                });
            else {
                $scope.resource = map.get('resources')[0];
                $scope.viewType = 'resource';
            }
        }
    });
});
