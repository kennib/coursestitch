angular.module('coursestitch-maps', ['coursestitch-resources', 'coursestitch-concepts']).

controller('MapsCtrl', function($scope, parseQuery) {
    parseQuery.new('Map')
        .find()
    .then(function(maps) {
        $scope.maps = maps.map(function(o) { return o.attributes; });
        $scope.$apply();
    });
}).
controller('MapCtrl', function($scope, $routeParams, deurlizeFilter, parseQuery, getConcept) {
    var mapTitle = deurlizeFilter($routeParams.mapTitle);
    var conceptTitle = deurlizeFilter($routeParams.conceptTitle);
    var resourceTitle = deurlizeFilter($routeParams.resourceTitle);
    var resourceSubtitle = deurlizeFilter($routeParams.resourceSubtitle);

    if (conceptTitle) {
        $scope.viewType = 'concept';
    } else if (resourceTitle && resourceSubtitle) {
        $scope.viewType = 'resource';
    }

    parseQuery.new('Map')
        .equalTo('title', mapTitle)
        .include(['resources'])
        .first()
    .then(function(map) {
        $scope.map = map.attributes;

        if (map.get('resources')) {
            $scope.resources = map.get('resources').map(function(o) { return o.attributes; });

            if ($scope.viewType === 'resource')
                $scope.resource = $scope.resources.filter(function(r) {
                    var hasTitle = r.title === resourceTitle;
                    var hasSubtitle = r.subtitle === resourceSubtitle;
                    return hasTitle && hasSubtitle;
                })[0];
            else if ($scope.viewType === 'concept')
                getConcept(conceptTitle)
                .then(function(concept, resources) {
                    if (concept) {
                        $scope.concept = concept.attributes;
                        $scope.concept.resources = resources.map(function(o) { return o.attributes; });
                    }

                    $scope.$apply();
                });
            else {
                $scope.resource = $scope.resources[0];
                $scope.viewType = 'resource';
            }
        }

        $scope.$apply();
    });
});
