angular.module('coursestitch-concepts', []).

service('getConcept', function() {
    return function(conceptId) {
        var conceptQuery = new Parse.Query('Concept')
            .get(conceptId)
        .then(function(concept) {
            var resourceQuery = new Parse.Query('Resource')
                .equalTo('teaches', concept)
                .find();
            return Parse.Promise.when(concept, resourceQuery);
        });
        return conceptQuery;
    };
}).

directive('concept', function(makeURL) {
    return {
        restrict: 'E',
        templateUrl: '/templates/concept.html',
        scope: {
            map: '=',
            concept: '=',
            mode: '@',
        },
        link: function(scope, elem, attrs) {
            scope.makeURL = makeURL;

            // Watch to see if a concept has been loaded
            scope.$watch('concept', function(concept) {
                if(concept !== undefined)
                    scope.status = 'loaded';
            });
        },
    };
});
