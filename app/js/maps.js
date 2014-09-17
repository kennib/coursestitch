angular.module('coursestitch-maps', [
    'parse-angular',
    'coursestitch-resources', 'coursestitch-concepts'
]).

service('Map', function() {
    return Parse.Object.extend('Map', {
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
}).
service('mapCache', function($cacheFactory) {
    return $cacheFactory('map-cache');
}).
service('fetchMap', function() { 
    return function(mapId, userId) {
        return Parse.Cloud.run('getUnderstandingMap', {mapId: mapId, userId: userId});
    };
}).
service('getMap', function(Map, Resource, Concept, fetchMap,
                           mapCache, resourceCache, resourceUnderstandingCache, conceptUnderstandingCache) {
    // Return cached versions of maps if they exist
    // Otherwise fetch the map and cache it
    return function(mapId, userId) {
        if (mapCache.get(mapId+userId) === undefined) {
            // Cache map
            var map = fetchMap(mapId, userId);
            mapCache.put(mapId+userId, map.then(function(map) {
                map.map.concepts = map.concepts;
                return map.map;
            }));


            // Cache understandings
            map.then(function(map) {
                // Cache resource understandings
                map.understandings.forEach(function(u) {
                    resourceUnderstandingCache.put(u.get('resource').id+userId, Parse.Promise.as(u));
                });
                // Cache concept understandings
                map.conceptUnderstandings.forEach(function(u) {
                    conceptUnderstandingCache.put(u.get('concept').id+userId, Parse.Promise.as(u));
                });
                // Cache resources
                var resources = map.map.get('resources');
                resources.forEach(function(resource, r) {
                    // Use existing cache if necessary
                    resourceCache.putGet(resource.id, Parse.Promise.as(resource))
                    .then(function(resource) {
                        resources[r] = resource;
                    });
                });
            });
        }

        return mapCache.get(mapId+userId);
    };
}).

controller('MapsCtrl', function($scope) {
    new Parse.Query('Map')
        .equalTo('owner', undefined)
        .find()
    .then(function(maps) {
        $scope.maps = maps;
    });
}).

controller('MapCtrl', function($scope, $location, $routeParams, deurlizeFilter,
                               getMap, mapCache,
                               resourceCache, newResource, getConcept) {
    $scope.newResource = newResource;

    var mapId = $routeParams.mapId;
    var mapTitle = $routeParams.mapTitle;
    var viewType = $routeParams.viewType;
    var viewId = $routeParams.viewId;
    var viewTitle = $routeParams.viewTitle;
    var viewSubtitle = $routeParams.viewSubtitle;

    if (viewType == 'concept' || viewType == 'resource') {
      $scope.viewType = viewType;
      $scope.viewId = viewId;
    } else {
      // Do something if the type is not concept or resource. Or something.
    }

    var userId;
    if (Parse.User.current())
        userId = Parse.User.current().id
    else
        userId = undefined;

    $scope.makeMapURL = function(id) {
        return $scope.makeURL($scope.map, id);
    };

    // Map or list mode
    $scope.mapMode = true;
    $scope.setMapMode = function(mode) {
        $scope.mapMode = mode;
    };

    getMap(mapId, userId)
    .then(function(map) {
        // The map has been loaded!
        $scope.status = 'loaded';
        $scope.map = map;

        // Get the resources and concepts of this map
        var resources = map.get('resources');
        var concepts = map.concepts;

        $scope.resources = resources;
        $scope.concepts = concepts;

        // Update the view
        $scope.$watchCollection('[viewType, viewId]', function() {
            if ($scope.viewType === 'resource') {
                resourceCache.get($scope.viewId)
                .then(function(resource) {;
                    $scope.resource = resource;
                });
            } else if ($scope.viewType === 'concept') {
                getConcept($scope.viewId)
                .then(function(concept, resources) {
                    if (concept) {
                        $scope.concept = concept;
                        $scope.concept.resources = resources;
                    }
                });
            }
        });

        // Function to change map view
        $scope.setView = function(viewObject) {
            // Update view
            $scope.viewType = viewObject.className.toLowerCase();
            $scope.viewId = viewObject.id;
            
            // Update URL
            var url = $scope.makeURL($scope.map, viewObject).slice(2);
            $location.path(url, false);
        };

        // Function to add new resources
        $scope.newResource = function(resourceUrl, mapId) {
            return newResource(resourceUrl, mapId)
            .then(function(resource) {
                // Reset map cache
                mapCache.remove(mapId+userId);

                // Reload page with the new resource
                var url = $scope.makeURL(map, resource);
                $location.path(url.slice(3));
            });
        };
    });
});
