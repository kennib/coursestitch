angular.module('coursestitch-maps', [
    'parse-angular',
    'coursestitch-resources', 'coursestitch-concepts'
]).

controller('MapsCtrl', function($scope) {
    new Parse.Query('Map')
        .find()
    .then(function(maps) {
        $scope.maps = maps;
    });
}).
controller('MapCtrl', function($scope, $routeParams, deurlizeFilter, getConcept) {
    var mapId = $routeParams.mapId;
    var mapTitle = $routeParams.mapTitle;
    var viewType = $routeParams.viewType;
    var viewId = $routeParams.viewId;
    var viewTitle = $routeParams.viewTitle;
    var viewSubtitle = $routeParams.viewSubtitle;

    if (viewType == 'concept' || viewType == 'resource') {
      $scope.viewType = viewType;
    } else {
      // Do something if the type is not concept or resource. Or something.
    }

    new Parse.Query('Map')
        .equalTo('objectId', mapId)
        .include(['resources'])
        .first()
    .then(function(map) {
        $scope.map = map.attributes;

        if (map.get('resources')) {
            var resources = map.get('resources')
            // Set the map's resources to be used in the scope, which allows it to be rendered.
            // This could be empty if the map has no associated resources.
            $scope.resources = resources;

            if ($scope.viewType === 'resource') {
                // Retrieve the resource with the given ID parsed from the route, regardless of
                // whether the resource is in the map or not.
                new Parse.Query('Resource')
                    .get(viewId)
                .then(function(resource) {
                    $scope.resource = resource;
                });

            } else if ($scope.viewType === 'concept')
                // Retrieves the Concept object given with the ID, as well as all resources that
                // teach the concept.
                getConcept(viewId)
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
}).

controller('URLCtrl', function($scope, makeURL) {
    $scope.makeURL = makeURL;
});
