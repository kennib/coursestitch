angular.module('coursestitch-resources', ['decipher.tags', 'ui.bootstrap.typeahead']).

service('Resource', function(resourceUnderstandingCache) {
    return Parse.Object.extend('Resource', {
        understandingObj: function() {
            var user = Parse.User.current();
            var userId = user ? user.id : undefined;
            return resourceUnderstandingCache.get(this.id, userId);
        },
        understanding: function() {
            return this.understandingObj()
            .then(function(u) {
                return u ? u.get('understands') : undefined;
            });
        },
        inMap: function(map) {
            // Find the index of the resource
            var resource = this;
            var resources = map.get('resources');
            var index = resources.findIndex(function(r) {
                return r.id === resource.id;
            });

            return index !== -1;
        },
        toggleMap: function(map) {
            // Find the index of the resource
            var resource = this;
            var resources = map.get('resources');
            var index = resources.findIndex(function(r) {
                return r.id === resource.id;
            });

            // Add the resource if it was missing from the map
            if (index === -1) {
                resources.push(this);
            }
            // Remove the resource if it was in the map
            else {
                resources.splice(index, 1);
            }
            
            // Save map to the server
            map.save();

            // Scroll to this resource in the resource list
            // The timeout is to wait for angular to update the DOM
            var self = this;
            setTimeout(function(){
                self.scrollTo();
            }, 20);
        },
        scrollTo: function() {
            // Scroll resource list to a given resource
            var resources = $('.resources');
            var resource = $('[data-id='+this.id+']');
            resources.animate({scrollTop: resources.scrollTop() + resource.position().top - 50}, 500, 'swing');
        },
    });
}).
service('resourceCache', function(objectCache) {
    return objectCache('resource', function(resourceId) {
        return new Parse.Query("Resource")
            .include('teaches')
            .include('requires')
            .get(resourceId);
    });
}).
service('resourceUnderstandingCache', function(objectCache) {
    return objectCache('resource-understanding', function(resourceId, userId) {
        if (userId)
            return Parse.Cloud.run('getResourceUnderstanding', {resourceId: resourceId, userId: userId});
        else
            return Parse.Promise.as(undefined)
    });
}).
service('newResource', function() {
    return function(resourceUrl, mapId) {
        return Parse.Cloud.run('summariseResource', {url: resourceUrl, mapId: mapId});
    };
}).
service('completedResources', function(resultFilter) {
    return function(resources) {
        return resources.every(function(resource) {
            return resultFilter(resource.understanding()) == 1.0;
        });
    };
}).
service('toggleResource', function() {
    return function(map, resource) {
        var resources = map.get('resources');
        var index = resources.findIndex(function(r) {
            return r.id === resource.id;
        });
        
        if (index === -1)
            resources.push(resource);
        else
            resources.splice(index, 1);

        map.save();
    };
}).
service('requires', function() {
	return function(resource, requirement) {
		var dependencies = resource.get('requires');
		var teachings = requirement.get('teaches');

		for (var d in dependencies)
			if (teachings.find(function(concept) { return dependencies[d].id == concept.id }))
				return true;
		
		return false;
	};
}).

filter('join', function() {
    return function(list, string) {
        return list.join(string || ',');
    };
}).

controller('ExternalCtrl', function($scope, $routeParams, $sce, makeURL,
                                    getMap, resourceCache) {
    $scope.makeURL = makeURL;

    var mapId = $routeParams.mapId;
    var mapTitle = $routeParams.mapTitle;
    var viewType = $routeParams.viewType;
    var viewId = $routeParams.viewId;
    var viewTitle = $routeParams.viewTitle;
    var viewSubtitle = $routeParams.viewSubtitle;

    // Get user
    var userId;
    if (Parse.User.current())
        userId = Parse.User.current().id
    else
        userId = undefined;

    // Get map
    getMap(mapId, userId)
    .then(function(map) {
        $scope.map = map;
    });

    // Get resource
    resourceCache.get(viewId)
    .then(function(resource) {
        $scope.resource = resource;
        $scope.resourceURL = $sce.trustAsResourceUrl(resource.attributes.url);
    });

    // Finish loading resource/map
    $scope.$watchCollection('[resource, map]', function() {
        var resource = $scope.resource;
        var map = $scope.map;

        if (resource !== undefined && map !== undefined) {
            // Resource has been loaded
            $scope.status = 'loaded';

            // Get the understanding of this resource
            resource.understandingObj()
            .then(function(understanding) {
                $scope.understanding = understanding;

                // Move understanding from unread
                if (understanding.get('understands') == 0)
                    understanding.set('understands', 0.1);
            });

            // Add the resource to the map
            var inMap = map.get('resources').findIndex(function(r) { return r.id == resource.id; }) != -1;
            if (!inMap) {
                map.get('resources').push({
                    __type: 'Pointer',
                    className: 'Resource',
                    objectId: resource.id,
                });
                map.save({
                    resources: map.get('resources'),
                });
            }
        }
    });

    // Update the understanding as necessary
    $scope.$watch('understanding.attributes.understands', function(understanding, oldUnderstanding) {
        if (understanding != oldUnderstanding) {
            $scope.understanding.save($scope.understanding.attributes);
        }
    });
}).

directive('resource', function(toggleResource, makeURL, conceptUnderstandingCache) {
    return {
        restrict: 'E',
        templateUrl: 'templates/resource.html',
        scope: {
            map: '=',
            resource: '=',
        },
        link: function(scope, elem, attrs) {
            scope.makeURL = makeURL;
            scope.makeMapURL = function(obj) { return scope.makeUrl(scope.map, obj); };
            scope.editMode = false;

            // Toggle between edit and view modes
            scope.setEditMode = function(mode) {
                scope.editMode = mode;
            };

            // Save the resource
            scope.save = function() {
                return scope.resource.save(scope.resource.attributes);
            };

            // Reset the resource
            scope.reset = function() {
                return scope.resource.fetch();
            };

            scope.$watchCollection('[resource, map]', function() {
                var resource = scope.resource;
                var map = scope.map;

                if (resource !== undefined && map !== undefined) {
                    // Resource has been loaded
                    scope.status = 'loaded';

                    // Get the understanding of this resource
                    resource.understandingObj()
                    .then(function(understanding) {
                        scope.understanding = understanding;
                    });

                    // Get list of concepts for autocompletion
                    scope.concepts = map.concepts;
                }
            });

            // Update the understanding as necessary
            scope.$watch('understanding.attributes.understands', function(understanding, oldUnderstanding) {
                if (understanding != oldUnderstanding) {
                    scope.understanding.save(scope.understanding.attributes)
                    .then(function() {;
                        // Remove the cache of concept understandings since they have changed now
                        conceptUnderstandingCache.cache.removeAll();
                    });
                }
            });

            // Function to use ng-click as a link
            // This is useful for linking block tags which can't be wrapped in anchor tags
            scope.goTo = function(url) {
                window.location = url;
            };
        },
    };
});
