angular.module('coursestitch-components', []).

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
