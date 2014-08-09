angular.module('coursestitch-resources', ['decipher.tags', 'ui.bootstrap.typeahead']).

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

directive('resource', function(toggleResource) {
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
            scope.tags = ["teaches", "requires"];
            scope.editMode = false;

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
