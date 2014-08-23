angular.module('coursestitch-resources', ['decipher.tags', 'ui.bootstrap.typeahead']).

value('Resource', function(resourceUnderstandingCache) {
    return Parse.Object.extend('Resource', {
        understandingObj: function() {
            var userId = Parse.User.current().id;
            return resourceUnderstandingCache.get(this.id+userId);
        },
        understanding: function() {
            return this.understandingObj().get('understands');
        },
    })
}).
service('resourceUnderstandingCache', function($cacheFactory) {
    return $cacheFactory('resource-understanding-cache');
}).
service('newResource', function() {
    return function(resourceUrl, mapId) {
        return Parse.Cloud.run('summariseResource', {url: resourceUrl, mapId: mapId});
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

filter('join', function() {
    return function(list, string) {
        return list.join(string || ',');
    };
}).

directive('resource', function(toggleResource, makeURL) {
    return {
        restrict: 'E',
        templateUrl: '/templates/resource.html',
        scope: {
            map: '=',
            resource: '=',
        },
        link: function(scope, elem, attrs) {
            scope.makeURL = makeURL;
            scope.tags = ["teaches", "requires"];
            scope.editMode = false;
            
            // Watch to see if a resource has been loaded
            scope.$watch('resource', function(resource) {
                if(resource !== undefined)
                    scope.status = 'loaded';
            });

            // Get the tags for this resource
            var addTags = function(resource) {
                scope.tags.forEach(function(tagLabel) {
                    var tags = resource.get(tagLabel);
                    if (tags)
                        resource.tags[tagLabel] = tags.map(function(concept) {
                            return concept.get('title');
                        });
                });
                return resource;
            };

            // Set up the tags for the resource
            scope.$watch('resource', function() {
                if (scope.resource === undefined)
                    return;

                scope.resource.tags = {};
                addTags(scope.resource);
            });

            scope.$watch('editMode', function() {
                if (scope.editMode)
                    scope.mode = 'edit';
                else
                    scope.mode = 'view';
            });

            scope.toggleResource = function() {
                toggleResource(scope.map, scope.resource);
            };
        
            // Update whether the resource is part of the map or not
            scope.$watch('resource', function() {
                if (scope.map) {
                    var resources = scope.map.get('resources');
                    scope.inMap = resources.findIndex(function(r) {
                        return r.id === scope.resource.id;
                    }) !== -1;
                }
            });

            // Update tags
            scope.$watch('resource.tags', function(tags) {
                if (tags === undefined)
                    return;

                if (scope.editMode)
                    angular.forEach(tags, function(tags, tagType) {
                        scope.resource.set(tags, tagType);
                        scope.resource.attributes[tagType] = tags;
                    });
            }, true);

            // Function to fetch resource tag objects
            var fetchTags = function(resource) {
                // Fetch the tags for the resource
                var fetches = scope.tags.map(function(tagType) {
                    var tags = resource.get(tagType);
                    return tags.map(function(tag) {
                        return tag.fetch();
                    });
                }).reduce(function(a, b) {
                    return a.concat(b);
                });

                return Parse.Promise.when([resource].concat(fetches));
            };

            // Save the resource
            scope.save = function() {
                return scope.resource.save()
                .then(fetchTags)
                .then(addTags);
            };

            // Reset the resource
            scope.reset = function() {
                return scope.resource.fetch()
                .then(fetchTags)
                .then(addTags);
            };
        },
    };
});
