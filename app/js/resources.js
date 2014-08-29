angular.module('coursestitch-resources', ['decipher.tags', 'ui.bootstrap.typeahead']).

service('Resource', function(resourceUnderstandingCache) {
    return Parse.Object.extend('Resource', {
        understandingObj: function() {
            var user = Parse.User.current();
            var userId = user ? user.id : undefined;
            return resourceUnderstandingCache.get(this.id, userId);
        },
        understanding: function() {
            var u = this.understandingObj();
            return u ? u.get('understands') : undefined;
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
            if (index === -1)
                resources.push(this);
            // Remove the resource if it was in the map
            else
                resources.splice(index, 1);
            
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
            resources.scrollTop(resources.scrollTop() + resource.position().top );
        },
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

directive('resource', function(toggleResource, makeURL, isEditor) {
    return {
        restrict: 'E',
        templateUrl: 'templates/resource.html',
        scope: {
            map: '=',
            resource: '=',
            concepts: '=',
        },
        link: function(scope, elem, attrs) {
            scope.makeURL = makeURL;
            scope.tags = ["teaches", "requires"];
            scope.editMode = false;

            // Check whether user can edit the resource
            scope.isEditor = false;
            isEditor()
            .then(function(editor) {
                scope.isEditor = editor;
            });

            // Toggle between edit and view modes
            scope.toggleEditMode = function() {
                scope.editMode = !scope.editMode;
            };
            
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

            // Get the user's understanding of this resource
            scope.$watch('resource', function() {
                if (scope.resource) {
                    if (scope.resource.understandingObj())
                        scope.understanding = scope.resource.understandingObj();

                    scope.setUnderstanding = function(understands) {
                        if (scope.understanding) {
                            scope.understanding.set('understands', understands);
                            scope.understanding.save(scope.understanding.attributes);
                        }
                    }
                }
            });

            // Add the names of concepts as keywords for tags
            scope.$watchCollection('[resource, concepts]', function() {
                if (scope.concepts)
                    conceptNames = scope.concepts.map(function(c) { return c.get('title'); });
                else
                    conceptNames = [];

                if (scope.resource)
                    scope.resource.keywords = scope.resource.get('keywords').concat(conceptNames);
            });

            // Save the resource
            scope.save = function() {
                return scope.resource.save(scope.resource.attributes)
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
