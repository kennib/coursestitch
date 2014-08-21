angular.module('coursestitch-maps', [
    'parse-angular',
    'coursestitch-resources', 'coursestitch-concepts'
]).

// Caches
value('maps', {}).
value('understandings', {}).
value('conceptUnderstandings', {}).

service('fetchMap', function(understandings, conceptUnderstandings) {
    Parse.Object.extend('Map', {
        understanding: function() {
            var resources = this.get('resources');

            var us = resources.reduce(function(u, r) {
                if (r.understanding())
                    return u + r.understanding();
                else
                    return r;
            }, 0);

            return us / resources.length;
        },
    });

    Parse.Object.extend('Resource', {
        understandingObj: function() {
            var userId = Parse.User.current().id;
            return understandings[this.id+userId];
        },
        understanding: function() {
            return this.understandingObj().get('understands');
        },
    });

    Parse.Object.extend('Concept', {
        understandingObj: function() {
            var userId = Parse.User.current().id;
            return conceptUnderstandings[this.id+userId];
        },
        understanding: function() {
            return this.understandingObj().get('understands');
        },
    });

    var ConceptUnderstanding = Parse.Object.extend('ConceptUnderstanding');

    return function(mapId, userId) {
        return Parse.Cloud.run('getUnderstandingMap', {mapId: mapId, userId: userId});
    };
}).

service('getMap', function(maps, understandings, conceptUnderstandings, fetchMap) {
    // Return cached versions of maps if they exist
    // Otherwise fetch the map and cache it
    return function(mapId, userId) {
        if (maps[mapId+userId] === undefined) {
            // Cache map
            var map = fetchMap(mapId, userId);
            maps[mapId+userId] = map.then(function(map) { return map.map });

            // Cache understandings
            map.then(function(map) {
                // Cache resource understandings
                map.understandings.forEach(function(u) {
                    understandings[u.get('resource').id+userId] = u;
                });
                // Cache concept understandings
                map.conceptUnderstandings.forEach(function(u) {
                    conceptUnderstandings[u.get('concept').id+userId] = u;
                });
            });
        }

        return maps[mapId+userId];
    };
}).

controller('MapsCtrl', function($scope) {
    new Parse.Query('Map')
        .find()
    .then(function(maps) {
        $scope.maps = maps;
    });
}).
controller('MapCtrl', function($scope, $routeParams, deurlizeFilter, getMap, getConcept, newResource) {
    $scope.newResource = newResource;

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

    var userId;
    if (Parse.User.current())
        userId = Parse.User.current().id
    else
        userId = undefined;

    getMap(mapId, userId)
    .then(function(map) {
        // The map has been loaded!
        $scope.status = 'loaded';

        $scope.map = map;
        if (map.get('resources')) {
            var resources = map.get('resources')
            // Set the map's resources to be used in the scope, which allows it to be rendered.
            // This could be empty if the map has no associated resources.
            $scope.resources = resources;

            if ($scope.viewType === 'resource') {
                // Retrieve the resource with the given ID parsed from the route, regardless of
                // whether the resource is in the map or not.
                var resource = resources.find(function(resource) {
                    return resource.id === viewId;
                });

                if (resource === undefined)
                    new Parse.Query('Resource')
                        .include(['teaches', 'requires'])
                        .get(viewId)
                    .then(function(resource) {
                        $scope.resource = resource;
                    });
                else
                    $scope.resource = resource;

            } else if ($scope.viewType === 'concept')
                // Retrieves the Concept object given with the ID, as well as all resources that
                // teach the concept.
                getConcept(viewId)
                .then(function(concept, resources) {
                    if (concept) {
                        $scope.concept = concept;
                        $scope.concept.resources = resources;
                    }
                });
            else {
                $scope.resource = resources[0];
                $scope.viewType = 'resource';
            }
        }
    });
});
