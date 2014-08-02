angular.module('coursestitch-resources', []).

directive('resource', function() {
    return {
        restrict: 'E',
        templateUrl: '/templates/resource.html',
        scope: {
            map: '=',
            resource: '=',
            mode: '@',
        },
        link: function(scope, elem, attrs) {
            scope.tags = ["teaches", "requires"];
        },
    };
});
