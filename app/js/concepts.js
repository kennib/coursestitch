angular.module('coursestitch-concepts', []).

service('Concept', function(conceptUnderstandingCache) {
    return Parse.Object.extend('Concept', {
        understandingObj: function() {
            var user = Parse.User.current();
            var userId = user ? user.id : undefined;
            return conceptUnderstandingCache.get(this.id, userId);
        },
        understanding: function() {
            return this.understandingObj()
            .then(function(u) {
                return u ? u.get('understands') : undefined;
            });
        },
    })
}).
service('ConceptUnderstanding', function() {
    return Parse.Object.extend('ConceptUnderstanding');
}).
service('conceptUnderstandingCache', function(objectCache) {
    return objectCache('concept-understanding', function(conceptId, userId) {
        if (userId)
            return Parse.Cloud.run('getConceptUnderstanding', {conceptId: conceptId, userId: userId});
        else
            return Parse.Promise.as(undefined);
    });
}).
service('getConcept', function() {
    return function(conceptId) {
        var conceptQuery = new Parse.Query('Concept')
            .get(conceptId)
        .then(function(concept) {
            // Resources this concept can be taught by
            var teachesQuery = new Parse.Query('Resource')
                .equalTo('teaches', concept)
                .find();
            // Resources this concept teaches
            var requiresQuery = new Parse.Query('Resource')
                .equalTo('requires', concept)
                .find();
            return Parse.Promise.when(concept, teachesQuery, requiresQuery);
        });
        return conceptQuery;
    };
}).

directive('concept', function(makeURL) {
    return {
        restrict: 'E',
        templateUrl: 'templates/concept.html',
        scope: {
            map: '=',
            concept: '=',
            mode: '@',
            setView: '=',
        },
        link: function(scope, elem, attrs) {
            scope.makeURL = makeURL;

            // Watch to see if a concept has been loaded
            scope.$watch('concept', function(concept) {
                if(concept !== undefined) {
                    scope.status = 'loaded';
                    
                    // Get the understanding of this resource
                    concept.understandingObj()
                    .then(function(understanding) {
                        scope.understanding = understanding;
                    });
                }
            });
            
            // Update the understanding as necessary
            scope.$watch('understanding.attributes.understands', function(understanding, oldUnderstanding) {
                if (understanding != oldUnderstanding) {
                    scope.understanding.save(scope.understanding.attributes);
                }
            });
        },
    };
});
