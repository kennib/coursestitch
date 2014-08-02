angular.module('coursestitch-concepts', []).

service('getConcept', function(parseQuery) {
    return function(conceptTitle) {
        var conceptQuery = parseQuery.new('Concept')
            .equalTo('title', conceptTitle)
            .first();

        var resourceQuery = parseQuery.new('Resource')
            .equalTo('teaches', conceptTitle)
            .find();

        return Parse.Promise.when(conceptQuery, resourceQuery);
    };
});
