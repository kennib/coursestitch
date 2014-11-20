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

directive('understandingSlider', function($timeout, understandingClassFilter, knowledgeMap) {
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

                knowledgeMap.refresh();
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

directive('resourceConceptTags', function(Concept) {
    return {
        restrict: 'E',
        templateUrl: 'templates/resource-tags.html',
        scope: {
            resource: '=',
            editMode: '=',
            setView: '=',
        },
        link: function(scope, elem, attrs) {
            scope.tags = ["requires", "teaches"];
        },
    };
}).

directive('conceptTags', function(Concept, knowledgeMap) {
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
                var tags = concepts
                .map(function(concept) {
                    return {name: concept.attributes.title, value: concept};
                });

                scope.srcTags = uniqueItems(tags, function(tag) { return tag.name; });
            });

            // When the tag input changes update the model
            scope.$on('decipher.tags.added', function(e, result) {
                var tag = result.tag;
                var concept = tag.value ? tag.value : new Concept({title: tag.name});
                scope.ngModel.push(concept);
                knowledgeMap.updateFocus();
            });

            scope.$on('decipher.tags.removed', function(e, removed) {
                var index = scope.ngModel.findIndex(function(tag, t) {
                    return tag.id === removed.tag.value.id;
                });
                scope.ngModel.splice(index, 1);
                knowledgeMap.updateFocus();
            });

            // When the tag input is initialised use the model as the list of tags
            scope.$watch('ngModel', function(tags) {
				scope.tagModel = tags.map(function(tag) {
					return {value: tag, name: tag.attributes.title};
				});
            });
        },
    };
}).

service('knowledgeMap', function() {
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

    this.d3 = knowledgeMap.d3;
    this.graphlib = knowledgeMap.graphlib;

    this.map = undefined;
    this.create = function(config) {
        config.resources = config.resources.map(translateResource);
        return this.map = knowledgeMap.create(config);
    };

    this.focus = undefined;
    this.setFocus = function(obj) {
        this.focus = obj;
        return this;
    };

    this.updateFocus = function() {
        if(this.map && this.focus) {
            this.map
                .hold()
                .addResource(translateResource(this.focus));
                // :(
            this.map
                .unhold()
                .render()
                .panTo('n'+this.focus.id, 1000)
                .highlightEdges('n'+this.focus.id, 'focused');
        }
        return this;
    };

    this.addResource = function(res) {
        if(this.map && res) {
            this.map.hold().addResource(translateResource(res));
            this.map.unhold().render();
        }
        return this;
    };

    this.removeResource = function(res) {
        if(this.map && res) {
            this.map.removeResource('n' + res.id);
        }
        return this;
    };

    this.refresh = function() {
        if(this.map) {
            this.map.refresh();
        }
        return this;
    };

    this.render = function() {
        if(this.map) {
            this.map.render();
        }
        return this;
    };
}).

directive('knowledgeMap', function(knowledgeMap, $filter) {
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

            // Add rects to concept nodes to make them look like flat ui tags.
            var conceptAppearancePlugin = function(km) {
                // Add rect elements when new nodes are created.
                km.renderNodes.onNew(function(nodes) {
                    nodes.filter('.concept').insert('rect', 'text')
                        .attr('stroke-dasharray', '3, 3')
                        // Round corners.
                        .attr('rx', '4px').attr('ry', '4px');
                });

                // Update rect properties during layout.
                km.renderNodes.onUpdate(function(nodes) {
                    nodes.filter('.concept').select('rect')
                        // Offset rects so they're centred.
                        .attr('x', function(d) { return -d.baseWidth/2 - 5; })
                        .attr('y', function(d) { return -d.baseHeight/2 - 3; })
                        // Add a bit of padding.
                        .attr('width', function(d) { return d.baseWidth + 10; })
                        .attr('height', function(d) { return d.baseHeight + 6; });
                });
                // Do not recalculate node sizes here; trust
                // resourceAppearancePlugin to do it!
            };

            // Add rects to concept nodes to make them look like flat ui tags.
            var resourceAppearancePlugin = function(km) {
                // Add rect elements when new nodes are created.
                km.renderNodes.onNew(function(nodes) {
                    nodes.filter('.resource').insert('rect', 'text')
                        .attr('rx', '0.25em').attr('ry', '0.25em');
                });

                var d3 = knowledgeMap.d3;
                var understandingClass = $filter('understandingClass');
                // Update rect properties during layout.
                km.renderNodes.onUpdate(function(nodes) {
                    nodes.filter('.resource').select('rect')
                        // Offset rects so they're centred.
                        .attr('x', function(d) { return -d.baseWidth/2 - 5; })
                        .attr('y', function(d) { return -d.baseHeight/2 - 3; })
                        // Add a bit of padding.
                        .attr('width', function(d) { return d.baseWidth + 10; })
                        .attr('height', function(d) { return d.baseHeight + 6; })
                        .each(function(d) {
                            var self = d3.select(this);
                            d.content.source.understanding().then(function(u) {
                                if(d.content._understandingClass) {
                                    self.classed(d.content._understandingClass, false);
                                }
                                d.content._understandingClass = understandingClass(u);

                                self.classed(d.content._understandingClass, true)
                                    .style('fill', function() {
                                        return self.style('background-color');
                                    });
                            });
                        })
                })
                // Recalculate node sizes after adding the rect, since it
                // expands the shape dimensions.
                .onUpdate(km.calculateNodeSizes);
            };

            // Change the default layout parameters.
            var layoutPlugin = function(km) {
                km.onPreLayout(function(config) {
                    config.rankSep(20);
                    config.nodeSep(20);
                    config.rankDir('LR');
                });
            };

            // Perform a poor man's version of 'transitive reduction' to remove
            // edges that don't affect the graph's connectivity.
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
                if(km) {
                    if(scope.focus) {
                        km.panTo('n'+scope.focus, 500);
                        km.highlightEdges('n'+scope.focus, 'focused');
                    } else {
                        km.panOut(500);
                        km.removeHighlight('focused');
                    }
                }
            });

            var panToPlugin = function(km) {
                var d3 = knowledgeMap.d3;

                km.panTo = function(id, duration) {
                    var x, y, scale;
                    if(typeof(id) == 'object') {
                        x = id.x;
                        y = id.y;
                        scale = id.scale;
                    } else if(this.graph.hasNode(id)) {
                        var n = this.graph.node(id);
                        x = n.layout.x;
                        y = n.layout.y;
                        scale = 1;
                    } else {
                        return;
                    }

                    var box = this.container.node().getBoundingClientRect();
                    x = x * scale - box.width/2;
                    y = y * scale - box.height/2;

                    if(!duration) {
                        this.zoom.translate([-x, -y]);
                        this.zoom.scale(scale);
                        this.zoom.event(this.element);
                    } else {
                        this.element.transition()
                            .duration(duration)
                            .call(this.zoom.scale(scale).event)
                            .call(this.zoom.translate([-x, -y]).event);
                    }
                    return this;
                };

                var bb, minZoom;
                km.onPostRender(function() {
                    // Calculate the maximum zoom factor based on the width of
                    // the element and the graph.
                    var svgWidth = km.container.node().getBoundingClientRect().width;
                    bb = km.element.node().getBBox()
                    minZoom = Math.max(0.1, Math.min(0.5, svgWidth / (bb.width + 100)));
                    km.zoom.scaleExtent([minZoom, 1]);
                });

                km.panOut = function(duration) {
                    this.panTo({
                        x: bb.width/2,
                        y: bb.height/2,
                        scale: minZoom
                    }, duration);
                    return this;
                };
            };

            var highlightPlugin = function(km) {
                var d3 = knowledgeMap.d3;
                km.removeHighlight = function(css) {
                    this.element.selectAll('.'+css).classed(css, false);
                };

                km.highlightEdges = function(id, css) {
                    this.removeHighlight(css);
                    if(this.graph.hasNode(id)) {
                        this.graph.incidentEdges(id).forEach(function(edge) {
                            d3.select('#'+edge).classed(css, true);
                        });
                    }
                };
            };

            var mouseHighlightPlugin = function(km) {
                km.renderNodes.onNew(function(nodes) {
                    nodes
                        .on('mouseover', function(d) {
                            km.highlightEdges(d.id, 'active');
                        })
                        .on('mouseout', function(d) {
                            km.removeHighlight('active');
                        });
                });
            };

            var animateNodesPlugin = function(km) {
                km.positionNodes
                    .offUpdate(km.defaultUpdateNodePositions)
                    .onUpdate(function(nodes) {
                        nodes.transition().duration(1000).attr('transform', function(n) {
                            var x = n.layout.x;
                            var y = n.layout.y;
                            return 'translate('+ x + ',' + y + ')';
                        });
                    });
            };

            scope.$watch('visible', function(currently, previously) {
                if(km && currently && !previously) {
                    km.render();
                    if(scope.focus) {
                        km.panTo('n' + scope.focus);
                    } else {
                        km.panOut();
                    }
                }
            });

            // Watch for the first assignment of the model. This will represent
            // the first data coming in from the server. Later changes are all
            // caused by UI actions and so are handled by events elsewhere.
            scope.$watch('model', function(model, prev) {
                if(model && !km) {
                    km = knowledgeMap.create({
                        resources: scope.model,
                        inside: '#km',
                        held: !scope.visible,
                        plugins: [
                            conceptAppearancePlugin,
                            resourceAppearancePlugin,
                            layoutPlugin,
                            tredPlugin,
                            linkPlugin,
                            panToPlugin,
                            highlightPlugin,
                            mouseHighlightPlugin,
                            animateNodesPlugin,
                        ],
                    });

                    if(scope.focus) {
                        km.panTo('n'+scope.focus);
                        km.highlightEdges('n'+scope.focus, 'focused');
                    } else {
                        km.panOut();
                        km.removeHighlight('focused');
                    }
                }
            } /* no deep watch */);
        },
    };
});
