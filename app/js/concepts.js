angular.module('coursestitch-concepts', []).

service('getConcept', function() {
    return function(conceptId) {
        var conceptQuery = new Parse.Query('Concept')
            .get(conceptId)
        .then(function(concept) {
            var resourceQuery = new Parse.Query('Resource')
                .equalTo('teaches', concept.get('title'))
                .find();
            return Parse.Promise.when(concept, resourceQuery);
        });
        return conceptQuery;
    };
}).

directive('concept', function() {
    return {
        restrict: 'E',
        templateUrl: '/templates/concept.html',
        scope: {
            map: '=',
            concept: '=',
            mode: '@',
        },
        link: function(scope, elem, attrs) {
        },
    };
});
