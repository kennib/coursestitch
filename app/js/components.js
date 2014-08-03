angular.module('coursestitch-components', []).

directive('switch', function() {
    return {
        restrict: 'AE',
        template: '<div ng-click="model = disabled && model || !disabled && !model;" ng-class="{\'deactivate\': disabled, \'switch-square\': square}" class="switch has-switch"><div ng-class="{\'switch-off\': !model, \'switch-on\': model}" class="switch-animate"><span class="switch-left">{{onLabel}}<i class="{{onIcon}}"></i></span><label>&nbsp</label><span class="switch-right">{{offLabel}}<i class="{{offIcon}}"></i></span></div></div>',
        replace: true,
        scope: {
            model: '=',
            disabled: '@',
            square: '@',
            onLabel: '@',
            offLabel: '@',
            onIcon: '@',
            offIcon: '@',
        },
        compile: function(element, attrs) {
            if (attrs.onLabel === void 0 && attrs.onIcon === void 0) {
                attrs.onLabel = 'ON';
            }
            if (attrs.offLabel === void 0 && attrs.offIcon === void 0) {
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

directive('understandingSlider', function() {
    return {
        restrict: 'E',
        templateUrl: '/templates/understanding-slider.html',
        scope: {
            ngModel: '=',
        },
        link: function(scope, element, attrs) {
            var slider = $(element).children(".ui-slider");
            slider.slider({
                min: -1,
                max: 1,
                step: 0.5,
                value: 0,
                orientation: 'horizontal',
                animate: 'fast',
                range: false,
            });

            slider.on('slide', function(event, ui) {
                scope.ngModel = ui.value;
                scope.$apply();
            });

            scope.$watch('ngModel', function() {
                if (scope.ngModel !== undefined)
                    slider.slider('value', scope.ngModel);
            });
        },
    };
});
