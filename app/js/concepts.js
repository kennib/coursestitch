angular.module('coursestitch-concepts', []).

service('Concept', function(getConceptUnderstanding) {
    return Parse.Object.extend('Concept', {
        understandingObj: function() {
            var userId = Parse.User.current().id;
            return getConceptUnderstanding(this.id, userId);
        },
        understanding: function() {
            return this.understandingObj().get('understands');
        },
    })
}).
service('conceptUnderstandingCache', function($cacheFactory) {
    return $cacheFactory('concept-understanding-cache');
}).
service('fetchConceptUnderstanding', function() {
    return function(conceptId, userId) {
        return Parse.Cloud.run('getConceptUnderstanding', {conceptId: conceptId, userId: userId});
    };
}).
service('getConceptUnderstanding', function(fetchConceptUnderstanding, conceptUnderstandingCache) {
    return function (conceptId, userId) {
        // Return cached versions of understanding if they exist
        // Otherwise fetch the understanding and cache it
        if (conceptUnderstandingCache.get(conceptId+userId) === undefined) {
            fetchConceptUnderstanding(conceptId, userId)
            .then(function(result) {
                console.log(result);
                conceptUnderstandingCache.put(conceptId+userId, result.understanding || {});
            });
        }

        return conceptUnderstandingCache.get(conceptId+userId);
    }
}).
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
