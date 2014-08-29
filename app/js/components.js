angular.module('coursestitch-components', [
    'decipher.tags', 'ui.bootstrap',
]).

directive('loading', function() {
    return {
        restrict: 'E',
        template: '<img src="images/loading.gif" class="loading" />',
        scope: {
           status: '=',
        },
        link: function(scope, elem, attrs) {
            scope.$watch('status', function(status) {
                if (status === 'loaded')
                    elem.hide();
            });
        },
    };
}).

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
        templateUrl: 'templates/action-button.html',
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
                    element
                    .attr('data-content', error.message)
                    .popover({
                        placement: 'top',
                        animate: true,
                        trigger: 'manual',
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

directive('understandingSlider', function($timeout, understandingClassFilter) {
    return {
        restrict: 'E',
        templateUrl: 'templates/understanding-slider.html',
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

            // Add some coloring to the slider
            var ranges = [[-1, 0], [0, 0], [0, 0.5], [0.5, 1.0], [1.0, 1.0]];
            ranges.forEach(function(range) {
                var percent = 100 * (range[1]-range[0])/2.0;
                var middle = (range[0]+range[1])/2;

                $('<div>')
                    .addClass('progress-bar')
                    .addClass(understandingClassFilter(middle))
                    .css('width', percent+'%')
                    .appendTo(slider);
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
            makeurl: '=',
        },

        link: function(scope, element, attrs) {
            var km;

            // Convert a concept from Parse format to Cartographer format.
            var translateConcept = function(s) {
                return {
                    id: s.id,
                    label: s.attributes.title,
                    content: { source: s },
                };
            };

            // Convert a resource from Parse format to Cartographer format.
            var translateResource = function(s) {
                var attrs = s.attributes;
                return {
                    label: attrs.title,
                    id: s.id,
                    teaches: attrs.teaches ?
                        attrs.teaches.map(translateConcept) : undefined,
                    requires: attrs.requires ?
                        attrs.requires.map(translateConcept) : undefined,
                    needs: attrs.needs ?
                        attrs.needs.map(translateConcept) : undefined,
                    content: { source: s },
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
                    config.rankDir('LR');
                });
            };

            // Make links to stuff.
            var d3 = knowledgeMap.d3;
            var linkPlugin = function(km) {
                km.renderNodes.onNew(function(nodes) {
                    nodes.select('text').each(function() {
                        var self = this;
                        d3.select(this.parentNode)
                            .insert('a', 'text')
                            .attr('xlink:href', function(d) {
                                return scope.makeurl(d.content.source);
                            })
                            .append(function() { return self; });
                    });
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
                        plugins: [
                            conceptAppearancePlugin,
                            layoutPlugin,
                            linkPlugin
                        ],
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
