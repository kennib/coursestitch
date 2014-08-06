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
controller('MapCtrl', function($scope, $routeParams, deurlizeFilter, getConcept, newResource) {
    $scope.newResource = newResource;

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
        $scope.mapId = map.id;
        $scope.map = map.attributes;

        if (map.get('resources')) {
            var resources = map.get('resources')
            $scope.resources = resources;

            if ($scope.viewType === 'resource') {
                $scope.resource = resources.filter(function(r) {
                    var hasTitle = r.attributes.title === resourceTitle;
                    var hasSubtitle = r.attributes.subtitle === resourceSubtitle;
                    return hasTitle && hasSubtitle;
                })[0];

                if ($scope.resource === undefined) {
                    new Parse.Query('Resource')
                        .equalTo('title', resourceTitle)
                        .equalTo('subtitle', resourceSubtitle)
                        .first()
                    .then(function(resource) {
                        $scope.resource = resource;
                    });
                }
            } else if ($scope.viewType === 'concept')
                getConcept(conceptTitle)
                .then(function(concept, resources) {
                    if (concept) {
                        $scope.concept = concept.attributes;
                        $scope.concept.resources = resources;
                    }
                });
            else {
                $scope.resource = resources[0];
                $scope.viewType = 'resource';
            }

            $scope.inMap = resources.indexOf($scope.resource) !== -1;
            $scope.$watch('inMap', function() {
                if ($scope.inMap && resources.indexOf($scope.resource) === -1)
                    resources.push($scope.resource);
                if (!$scope.inMap && resources.indexOf($scope.resource) !== -1)
                    resources.splice(resources.indexOf($scope.resource), 1);

                map.save();
            });
        }
    });
});
