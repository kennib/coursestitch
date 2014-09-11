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

directive('conceptTags', function(Concept) {
    return {
        restrict: 'E',
        template: '<tags data-src="{value: tag} as tag.attributes.title for tag in srcTags" data-model="tagModel" options="{addable: true}"></tags>',
        scope: {
           ngModel: '=',
           concepts: '=',
        },
        link: function(scope, elem, attrs) {
            // Convert concepts into tags
            scope.$watch('concepts', function(concepts) {
                scope.srcTags = concepts.map(function(concept) {
                    return {name: concept.attributes.title, value: concept};
                });
            });

            // When the tag input changes update the model
            scope.$on('decipher.tags.added', function(e, result) {
                var tag = result.tag;
                var concept = tag.value ? tag.value : new Concept({title: tag.name});
                scope.ngModel.push(concept);
            });

            scope.$on('decipher.tags.removed', function(e, removedTag) {
                var index = scope.ngModel.findIndex(function(tag, t) {
                    return tag.id === removedTag.value.id;
                });
                scope.ngModel.splice(index, 1);
            });

            // When the tag input is initialised use the model as the list of tags
            scope.$watch('ngModel', function(tags) {
                if (scope.tagModel === undefined)
                    scope.tagModel = tags.map(function(tag) {
                        return {value: tag, name: tag.attributes.title};
                    });
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
            focus: '=',
            visible: '=',
            makeUrl: '=',
            setView: '=',
        },

        link: function(scope, element, attrs) {
            var km;

            // Convert a concept from Parse format to Cartographer format.
            var translateConcept = function(s) {
                return {
                    id: 'n'+s.id,
                    label: s.attributes.title,
                    content: { source: s },
                };
            };

            // Convert a resource from Parse format to Cartographer format.
            var translateResource = function(s) {
                var attrs = s.attributes;
                return {
                    label: attrs.title,
                    id: 'n'+s.id,
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
                // Recalculate node sizes after adding the rect, since it
                // expands the shape dimensions.
                }).onUpdate(km.calculateNodeSizes);
            };

            // Change the default layout parameters.
            var layoutPlugin = function(km) {
                km.onPreLayout(function(config) {
                    config.rankSep(30);
                    config.rankDir('LR');
                });
            };

            var tredPlugin = function(km) {
                km.onPreLayout(function(c, g) {
                    var remove = [];
                    g.eachEdge(function(e, u, v) {
                        // Save edge data.
                        var s = g.source(e);
                        var t = g.target(e);
                        var d = g.edge(e);
                        // Remove edge temporarily.
                        g.delEdge(e);
                        // Check reachability without edge.
                        var dists = knowledgeMap.graphlib.alg.dijkstra(g, u);
                        if(dists[v].distance === Number.POSITIVE_INFINITY) {
                            // Re-add edge.
                            g.addEdge(e, s, t, d);
                        }
                    });
                });
            };

            // Make links to stuff.
            var linkPlugin = function(km) {
                var d3 = knowledgeMap.d3;
                km.renderNodes.onNew(function(nodes) {
                    // Wrap the existing text elements in anchors which we link
                    // to the appropriate URLs to view a resource or concept.
                    // These anchors' click events are prevented so that we
                    // don't just follow the links and refresh the page.
                    nodes.select('text').each(function() {
                        var self = this;
                        d3.select(this.parentNode)
                            .insert('a', 'text')
                            .attr('xlink:href', function(n) {
                                return scope.makeUrl(n.content.source);
                            })
                            .on('click', function(n) {
                                if(d3.event.which === 1) {
                                    d3.event.preventDefault();
                                }
                            })
                            .append(function() { return self; });
                    });

                    // When clicking anywhere on a node, call setView to focus
                    // the entire UI on the particular node.
                    nodes.on('click', function(n) {
                        scope.$apply(function() {
                            // This should change the target of scope.focus so
                            // that the map then pans to the node.
                            scope.setView(n.content.source);
                        });
                    });
                });
            };

            // Watch the target of 'focus', which includes changes from the UI
            // like clicking on links elsewhere on the page.
            scope.$watch('focus', function() {
                if(km && scope.focus) {
                    km.panTo('n'+scope.focus, 500);
                    km.highlightEdges('n'+scope.focus);
                }
            });

            var panToPlugin = function(km) {
                var d3 = knowledgeMap.d3;
                km.panTo = function(id, duration) {
                    if(km.graph.hasNode(id)) {
                        var box = d3.select('#km').node().getBoundingClientRect();
                        var scale = km.zoom.scale();
                        var n = km.graph.node(id);
                        var x = n.layout.x * scale - box.width/2;
                        var y = n.layout.y * scale - box.height/2;
                        if(!duration) {
                            km.zoom.translate([-x, -y]);
                            km.zoom.event(km.element);
                        } else {
                            km.element.transition()
                                .duration(duration)
                                .call(km.zoom.translate([-x, -y]).event);
                        }
                    }
                };
            };

            var highlightPlugin = function(km) {
                var d3 = knowledgeMap.d3;
                km.highlightNone = function() {
                    km.element.selectAll('.active').classed('active', false);
                };

                km.highlightEdges = function(id) {
                    km.highlightNone();
                    if(km.graph.hasNode(id)) {
                        km.graph.incidentEdges(id).forEach(function(edge) {
                            d3.select('#'+edge).classed('active', true);
                        });
                    }
                };
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
                            tredPlugin,
                            linkPlugin,
                            panToPlugin,
                            highlightPlugin
                        ],
                    });
                }
            });

            // When the map becomes visible, re-render it, as it may not have
            // rendered properly while it was off-screen.
            scope.$watch('visible', function(value, old) {
                if(value && !old && km) {
                    km.unhold().render();
                    if(scope.focus) {
                        km.panTo('n'+scope.focus);
                        km.highlightEdges('n'+scope.focus);
                    }
                }
            });
        },
    };
});
