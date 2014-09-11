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
            
            scope.$watch('resource', function(resource) {
                if (resource !== undefined) {
                    // Resource has been loaded
                    scope.status = 'loaded';

                    // Get the understanding of this resource
                    resource.understandingObj()
                    .then(function(understanding) {
                        scope.understanding = understanding;
                    });

                    // Get list of concepts for autocompletion
                    scope.concepts = scope.map.concepts;
                }
            });
        },
    };
});
