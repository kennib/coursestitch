angular.module('coursestitch-components', [
    'decipher.tags', 'ui.bootstrap',
]).

directive('switch', function() {
    return {
        restrict: 'AE',
        template: '<div ng-click="change()" ng-class="{\'deactivate\': disabled, \'switch-square\': square}" class="switch has-switch"><div ng-class="{\'switch-off\': !model, \'switch-on\': model}" class="switch-animate"><span class="switch-left">{{onLabel}}<i class="{{onIcon}}"></i></span><label>&nbsp</label><span class="switch-right">{{offLabel}}<i class="{{offIcon}}"></i></span></div></div>',
        replace: true,
        scope: {
            model: '=',
            onChange: '=',
            disabled: '@',
            square: '@',
            onLabel: '@',
            offLabel: '@',
            onIcon: '@',
            offIcon: '@',
        },
        link: function(scope, element, attrs) {
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

            scope.change = function() {
                // Update the model
                scope.model = scope.disabled && scope.model || !scope.disabled && !scope.model;

                // Fire the on change event
                if (scope.onChange)
                    scope.onChange();
            };
        },
    };
}).

directive('actionButton', function($timeout) {
    return {
        restrict: 'E',
        templateUrl: '/templates/action-button.html',
        scope: {
            action: '&',
            label: '@',
            idleStyle: '@',
            pendingStyle: '@',
            successStyle: '@',
            errorStyle: '@',
            idleIcon: '@',
            pendingIcon: '@',
            successIcon: '@',
            errorIcon: '@',
        },
        replace: true,
        link: function(scope, element, attrs) {
            // Default status
            scope.status = 'idle';

            // Action consequences
            scope.doAction = function() {
                scope.status = 'pending';

                scope.action()
                .then(function() {
                    scope.status = 'success';
                })
                .fail(function(error) {
                    scope.status = 'error';
                    
                    // Show a helpful error message
                    element.popover({
                        content: error.message,
                        placement: 'top',
                        animate: true,
                    })
                    .popover('show');
                })
                .always(function() {
                    $timeout(function() {
                        scope.status = 'idle';
                        element.popover('hide');
                    }, 6000);
                });
            };

            // Status styles and icons
            scope.$watch('status', function(status) {
                var style = status+'Style';
                var icon = status+'Icon';

                // By default show the idle style or icon
                if (scope[style] === undefined)
                    scope.style = scope.idleStyle;
                else
                    scope.style = scope[style];

                if (scope[icon] === undefined)
                    scope.icon = scope.idleIcon;
                else
                    scope.icon = scope[icon];

            });
        },
    };
}).

directive('understandingSlider', function($timeout) {
    return {
        restrict: 'E',
        templateUrl: '/templates/understanding-slider.html',
        scope: {
            ngModel: '=?',
            onChange: '=',
        },
        link: function(scope, element, attrs) {
            // Number of milliseconds an animation takes
            var animateTime = 1000;

            var slider = $(element).children(".ui-slider");
            slider.slider({
                min: -1,
                max: 1,
                step: 0.01,
                value: 0,
                orientation: 'horizontal',
                animate: animateTime,
                range: false,
            });

            slider.on('slidestop', function(event, ui) {
                // Set model value when animation stops
                $timeout(function() {
                    scope.ngModel = ui.value;
                    scope.$apply();
                }, animateTime);
            });

            scope.$watch('ngModel', function() {
                // Update the slider if the model changes
                if (scope.ngModel !== undefined)
                    slider.slider('value', scope.ngModel);

                // Call change event
                if (scope.onChange)
                    scope.onChange(scope.ngModel);
            });
        },
    };
}).

directive('knowledgeMap', function() {
    return {
        restrict: 'E',
        template: '<div id="km"></div>',
        replace: true,
        scope: {
            model: '=',
            visible: '=',
        },
        link: function(scope, element, attrs) {
            var km;

            // Convert a concept from Parse format to Cartographer format.
            var translateConcept = function(c) {
                return {
                    id: c.id,
                    label: c.attributes.title,
                };
            };

            // Convert a resource from Parse format to Cartographer format.
            var translateResource = function(s) {
                return {
                    label: s.attributes.title,
                    id: s.id,
                    teaches: s.attributes.teaches ?
                        s.attributes.teaches.map(translateConcept) : undefined,
                    requires: s.attributes.requires ?
                        s.attributes.requires.map(translateConcept) : undefined,
                    needs: s.attributes.needs ?
                        s.attributes.needs.map(translateConcept) : undefined
                };
            };

            // Add rects to concept nodes to make them look like flat ui tags.
            var conceptAppearancePlugin = function(km) {
                // Add rect elements when new nodes are created.
                km.renderNodes.onNew(function(nodes) {
                    nodes.filter('.concept').insert('rect', 'text');
                });

                // Update rect properties during layout.
                km.renderNodes.onUpdate(function(nodes) {
                    nodes.filter('.concept').select('rect')
                        // Offset rects so they're centred.
                        .attr('x', function(d) { return -d.width/2 - 5; })
                        .attr('y', function(d) { return -d.height/2 - 3; })
                        // Add a bit of padding.
                        .attr('width', function(d) { return d.width + 10; })
                        .attr('height', function(d) { return d.height + 6; })
                        // Round corners.
                        .attr('rx', '0.25em').attr('ry', '0.25em');
                }).onUpdate(km.calculateNodeSizes);
            };

            // Change the default layout parameters.
            var layoutPlugin = function(km) {
                km.onPreLayout(function(config) {
                    config.rankSep(30);
                });
            };

            // Watch for changes in the data we are bound to. When we get some
            // data (usually from AJAX), we'll create the knowledge map. Note
            // that this only happens once; re-renders are not handled yet.
            scope.$watch('model', function(){
                if(!km && scope.model) {
                    km = knowledgeMap.create({
                        resources: scope.model.map(translateResource),
                        inside: '#km',
                        held: !scope.visible,
                        plugins: [conceptAppearancePlugin, layoutPlugin],
                    });
                }
            });

            // When the map becomes visible, re-render it, as it may not have
            // rendered properly while it was off-screen.
            scope.$watch('visible', function(value, old) {
                if(value && !old && km) {
                    km.unhold().render();
                }
            });
        },
    };
});
