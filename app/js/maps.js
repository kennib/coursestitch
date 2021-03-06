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
service('createMap', function(mapCache) {
    return function(userId) {
        var map = Parse.Cloud.run('createMap', {userId: userId});

        return map.then(function(response) {
            mapCache.put(response.map.id+userId, map.then(function(response) {
                return response.map;
            }));

            return response.map;
        });
    };
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
service('nextResources', function(Map, Resource, Concept, ConceptUnderstanding) {
    return function(mapId, userId) {
        // Get resources from this map
        var mapResources = new Parse.Query(Map)
            .include('resources')
            .include('resources.teaches')
            .include('resources.requires')
            .get(mapId)
        .then(function(map) {
            return map.get('resources');
        });
        
        // Get concepts being taught by this map
        var taughtConcepts = mapResources.then(function(resources) {
            var teaches = resources.map(function(resource) {
                return resource.get('teaches');
            }).reduce(function(a, b) { return a.concat(b); }, []);
            
            return teaches;
        });

        // Get concepts learned by this user
        var learnedConcepts = taughtConcepts.then(function(concepts) {
            return new Parse.Query(ConceptUnderstanding)
                .containedIn('concept', concepts)
                .equalTo('user', {__type: 'Pointer', className: "_User", objectId: userId})
                .include('concept')
                .find();
        }).then(function(understandings) {
            return understandings.map(function(understanding) {
                return understanding.get('concept');
            });
        });

        // Get resources which require the learned concepts
        var nextResources = Parse.Promise.when(mapResources, learnedConcepts)
        .then(function(resources, concepts) {
            var resourceIds = resources.map(function(resource) { return resource.id; })
            return new Parse.Query(Resource)
                .include('teaches')
                .include('requires')
                .containedIn('requires', concepts)
                .notContainedIn('objectId', resourceIds)
                .find();
        });

        return nextResources;
    }
}).

filter('topologicalSort', function(requires) {
    return function(resources) {
        var sortedResources = [];
        
        resources.forEach(function(resource) {
            var index = 0;
            sortedResources.forEach(function(sortedResource, i) {
                if (requires(resource, sortedResource))
                    index = i;
            });
            sortedResources.splice(index, 0, resource);
        });

        return sortedResources;
    }
}).

controller('MapsCtrl', function($scope) {
    new Parse.Query('Map')
        .equalTo('owner', undefined)
        .find()
    .then(function(maps) {
        $scope.maps = maps;
    });

    if (Parse.User.current()) {
        new Parse.Query('Map')
            .equalTo('owner', Parse.User.current())
            .find()
        .then(function(maps) {
            $scope.myMaps = maps;
        });
    }
}).

controller('MapCtrl', function($scope, $location, $routeParams, deurlizeFilter,
                               getMap, mapCache,
                               resourceCache, newResource, getConcept,
                               completedResources) {
    $scope.completedResources = completedResources;
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

    // Save just the name of the map.
    $scope.saveMapMeta = function() {
        return $scope.map.save({
            title:   $scope.map.attributes.title,
            summary: $scope.map.attributes.summary,
        });
    };

    // Fetch the map from the server.
    $scope.resetMapMeta = function() {
        mapCache.remove(mapId+userId);
        return getMap(mapId, userId)
        .then(function(map) {
            $scope.map = map;
        });
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
        
        // Automatically jump to edit mode if the map has no resource
        if ($scope.resources.length === 0)
            $scope.editMode = true;

        // Update the view
        $scope.$watchCollection('[viewType, viewId]', function() {
            if ($scope.viewType === 'resource') {
                resourceCache.get($scope.viewId)
                .then(function(resource) {;
                    $scope.resource = resource;
                });
            } else if ($scope.viewType === 'concept') {
                getConcept($scope.viewId)
                .then(function(concept, taughtby, neededfor) {
                    if (concept) {
                        $scope.concept = concept;
                        $scope.concept.resources = {
                            taughtby: taughtby,
                            neededfor: neededfor,
                        };
                    }
                });
            }
        });

        // Function to add new resources
        $scope.newResource = function(resourceUrl, mapId) {
            return newResource(resourceUrl, mapId)
            .then(function(resource) {
                // Reset map cache
                mapCache.remove(mapId+userId);

                getMap(mapId, userId)
                .then(function(map) {
                    $scope.map = map;

                    // Get the resources and concepts of this map
                    var resources = map.get('resources');
                    var concepts = map.concepts;

                    $scope.resources = resources;
                    $scope.concepts = concepts;

                    // Reload page with the new resource
                    setTimeout(function(){
                        $scope.setView(resource);
                        $scope.$apply();
                    }, 20);
                });
            });
        };
    });
}).

controller('MapNextCtrl', function($scope, $location, $routeParams,
                                   deurlizeFilter,
                                   nextResources) {
    var userId;
    if (Parse.User.current())
        userId = Parse.User.current().id
    else
        userId = undefined;

    var mapId = $routeParams.mapId;
    var mapTitle = $routeParams.mapTitle;
    var viewType = 'next';

    $scope.viewType = viewType;

    $scope.map = {
        id: mapId,
        attributes: {
            title: deurlizeFilter(mapTitle),
        },
    };

    nextResources(mapId, userId).then(function(resources) {
        $scope.status = 'loaded';
        $scope.resources = resources;
    });
});
