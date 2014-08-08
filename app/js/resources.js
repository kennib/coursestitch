angular.module('coursestitch-resources', ['decipher.tags', 'ui.bootstrap.typeahead']).

service('newResource', function() {
    return function(resourceUrl, mapId) {
        return Parse.Cloud.run('summariseResource', {url: resourceUrl, mapId: mapId});
    };
}).
service('Understanding', function() {
    return Parse.Object.extend('Understanding');
}).
service('getUnderstanding', function(Understanding) {
    return function(resource) {
        // Get the understanding of the given resource
        var understandingQuery = new Parse.Query('Understanding')
            .equalTo('user', Parse.User.current())
            .equalTo('resource', resource)
            .first();

        return understandingQuery
        .then(function(understanding) {
            // Create a new understanding if none exists
            if (understanding === undefined) {
                understanding = new Understanding();

                understanding.set('user', Parse.User.current());
                understanding.set('resource', resource);
                understanding.set('understanding', 0);

                return understanding.save();
            } else {
                return understanding;
            }
        });
    };
}).

filter('join', function() {
    return function(list, string) {
        return list.join(string || ',');
    };
}).

directive('resource', function(getUnderstanding) {
    return {
        restrict: 'E',
        templateUrl: '/templates/resource.html',
        scope: {
            map: '=',
            resource: '=',
            resourceObj: '=',
            save: '&',
            reset: '&',
        },
        link: function(scope, elem, attrs) {
            scope.tags = ["teaches", "requires"];
            scope.editMode = false;

            // Get the user's understanding of this resource
            scope.$watch('resourceObj', function() {
                if (scope.resourceObj)
                    getUnderstanding(scope.resourceObj)
                    .then(function(understanding) {
                        scope.understanding = understanding;
                        scope.setUnderstanding = function(understands) {
                            scope.understanding.set('understands', understands);
                            scope.understanding.save(scope.understanding.attributes);
                        };
                    });
            });

            scope.$watch('editMode', function() {
                if (scope.editMode)
                    scope.mode = 'edit';
                else
                    scope.mode = 'view';
            });
        },
    };
});
