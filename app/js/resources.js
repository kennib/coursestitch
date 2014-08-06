angular.module('coursestitch-resources', ['decipher.tags', 'ui.bootstrap.typeahead']).

service('newResource', function() {
    return function(resourceUrl, mapId) {
        return Parse.Cloud.run('summariseResource', {url: resourceUrl, mapId: mapId});
    };
}).

filter('join', function() {
    return function(list, string) {
        return list.join(string || ',');
    };
}).

directive('resource', function() {
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

            // Add state of remote resource actions to the scope
            scope.resetResource = function() {
                scope.resetState = 'pending';

                scope.reset()
                .then(function() {
                    scope.resetState = 'success';
                })
                .fail(function() {
                    scope.resetSate = 'error';
                });
            };
            scope.saveResource = function() {
                scope.saveState = 'pending';

                scope.save()
                .then(function() {
                    scope.saveState = 'success';
                })
                .fail(function() {
                    scope.saveState = 'error';
                });
            };
        },
    };
});
