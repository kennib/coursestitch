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
            var animateTime = 500;

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

directive('resourceRead', function(Concept, mapCache) {
    return {
        restrict: 'E',
        templateUrl: 'templates/resource-read.html',
        scope: {
            resource: '=',
            map: '=',
            size: '@',
        },
        link: function(scope, elem, attrs) {
            scope.read = function() {
                var resource = scope.resource;
                var map = scope.map;

                if (resource !== undefined && map !== undefined) {
                    // Get the understanding of this resource
                    resource.understandingObj()
                    .then(function(understanding) {
                        // Move understanding from unread
                        if (understanding.get('understands') == 0)
                            understanding.set('understands', 0.001).save();
                    });

                    // Is this resource already inside our personal map?
                    var inMap = map.get('resources').findIndex(function(r) {
                        return r.id == resource.id;
                    }) != -1;

                    if (!inMap) {
                        mapCache.remove(map.id+Parse.User.current().id);
                        // Add the resource to the map
                        map.get('resources').push({
                            __type: 'Pointer',
                            className: 'Resource',
                            objectId: resource.id,
                        });
                        map.save({
                            resources: map.get('resources'),
                        });
                    }
                }
            };
        },
    };
}).

directive('resourceConceptTags', function(Concept, makeURL) {
    return {
        restrict: 'E',
        templateUrl: 'templates/resource-tags.html',
        scope: {
            resource: '=',
            map: '=',
            editMode: '=',
            concepts: '=',
        },
        link: function(scope, elem, attrs) {
            scope.makeURL = makeURL;
            scope.tags = ["requires", "teaches"];
        },
    };
}).

directive('conceptTags', function(Concept) {
    return {
        restrict: 'E',
        template: '<tags ng-init="srcTags=[]" data-src="tag as tag.name for tag in srcTags" data-model="tagModel" options="{addable: true}"></tags>',
        scope: {
           ngModel: '=',
           concepts: '=',
        },
        link: function(scope, elem, attrs) {
            // Method to get unique tags
            var seen = {},
                unique = [];
            var uniqueItems = function(array, f) {
                array.forEach(function(item) {
                    if (f === undefined) {
                        if (seen[item] === undefined) {
                            seen[item] = true;
                            unique.push(item);
                        }
                    } else {
                        if (seen[f(item)] === undefined) {
                            seen[f(item)] = true;
                            unique.push(item);
                        }
                    }
                });

                return unique;
            }; 

            // Convert concepts into tags
            scope.$watch('concepts', function(concepts) {
                if (concepts) {
                    var tags = concepts
                    .map(function(concept) {
                        return {name: concept.attributes.title, value: concept};
                    });

                    scope.srcTags = uniqueItems(tags, function(tag) { return tag.name; });
                }
            });

            // When the tag input changes update the model
            scope.$on('decipher.tags.added', function(e, result) {
                var tag = result.tag;
                var concept = tag.value ? tag.value : new Concept({title: tag.name});
                scope.ngModel.push(concept);
            });

            scope.$on('decipher.tags.removed', function(e, removed) {
                var index = scope.ngModel.findIndex(function(tag, t) {
                    return tag.id === removed.tag.value.id;
                });
                scope.ngModel.splice(index, 1);
            });

            // When the tag input is initialised use the model as the list of tags
            scope.$watch('ngModel', function(tags) {
              scope.tagModel = tags.map(function(tag) {
                return {value: tag, name: tag.attributes.title};
              });
            });
        },
    };
});
