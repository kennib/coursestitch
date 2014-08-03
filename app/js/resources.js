angular.module('coursestitch-resources', ['decipher.tags', 'ui.bootstrap.typeahead']).

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
        },
    };
});
