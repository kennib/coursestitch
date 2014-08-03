angular.module('coursestitch-concepts', []).

service('getConcept', function() {
    return function(conceptTitle) {
        var conceptQuery = new Parse.Query('Concept')
            .equalTo('title', conceptTitle)
            .first();

        var resourceQuery = new Parse.Query('Resource')
            .equalTo('teaches', conceptTitle)
            .find();

        return Parse.Promise.when(conceptQuery, resourceQuery);
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
