angular.module('coursestitch-resources', ['decipher.tags', 'ui.bootstrap.typeahead']).

service('newResource', function() {
    return function(resourceUrl, mapId) {
        return Parse.Cloud.run('summariseResource', {url: resourceUrl, mapId: mapId});
    };
}).
service('Understanding', function() {
    return Parse.Object.extend('Understanding');
}).
service('getUnderstanding', function(Understanding) {
    return function(resource) {
        // Get the understanding of the given resource
        var understandingQuery = new Parse.Query('Understanding')
            .equalTo('user', Parse.User.current())
            .equalTo('resource', resource)
            .first();

        return understandingQuery
        .then(function(understanding) {
            // Create a new understanding if none exists
            if (understanding === undefined) {
                understanding = new Understanding();

                understanding.set('user', Parse.User.current());
                understanding.set('resource', resource);
                understanding.set('understanding', 0);

                return understanding.save();
            } else {
                return understanding;
            }
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

filter('join', function() {
    return function(list, string) {
        return list.join(string || ',');
    };
}).

directive('resource', function(getUnderstanding, toggleResource, makeURL) {
    return {
        restrict: 'E',
        templateUrl: '/templates/resource.html',
        scope: {
            map: '=',
            resource: '=',
            save: '&',
            reset: '&',
        },
        link: function(scope, elem, attrs) {
            scope.makeURL = makeURL;
            scope.tags = ["teaches", "requires"];
            scope.editMode = false;

            // Get the tags for this resource
            scope.$watch('resource', function() {
                if (scope.resource === undefined)
                    return;

                scope.resource.tags = {};

                scope.tags.forEach(function(tagLabel) {
                    var tags = scope.resource.get(tagLabel);
                    if (tags)
                        scope.resource.tags[tagLabel] = tags.map(function(concept) {
                            return concept.get('title');
                        });
                });
            });

            // Get the user's understanding of this resource
            scope.$watch('resource', function() {
                if (scope.resource)
                    getUnderstanding(scope.resource)
                    .then(function(understanding) {
                        scope.understanding = understanding;
                        scope.setUnderstanding = function(understands) {
                            scope.understanding.set('understands', understands);
                            scope.understanding.save(scope.understanding.attributes);
                        };
                    });
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
        },
    };
});
