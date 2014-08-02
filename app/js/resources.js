angular.module('coursestitch-resources', []).

directive('flatuiSwitch', function() {
    return {
        restrict: 'AE',
        template: '<div ng-click="model = disabled && model || !disabled && !model" ng-class="{\'deactivate\': disabled, \'switch-square\': square}" class="switch has-switch"><div ng-class="{\'switch-off\': !model, \'switch-on\': model}" class="switch-animate"><span ng-bind="onLabel" class="switch-left"></span><label>&nbsp</label><span ng-bind="offLabel" class="switch-right"></span></div></div>',
        replace: true,
        scope: {
            model: '=',
            disabled: '@',
            square: '@',
            onLabel: '@',
            offLabel: '@'
        },
        compile: function(element, attrs) {
            if (attrs.onLabel === void 0) {
                attrs.onLabel = 'ON';
            }
            if (attrs.offLabel === void 0) {
                attrs.offLabel = 'OFF';
            }
            if (attrs.disabled === void 0) {
                attrs.disabled = false;
            } else {
                attrs.disabled = true;
            }
            if (attrs.square === void 0) {
                attrs.square = false;
            } else {
                attrs.square = true;
            }
        }
    };
}).

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
