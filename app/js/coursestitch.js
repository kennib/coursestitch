angular.module('coursestitch', [
    'ngRoute', 'ngAnimate', 'parse-angular',
    'coursestitch-maps', 'coursestitch-resources',
    'coursestitch-components'
]).

config(function($routeProvider, $locationProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'templates/home.html',
    })
    .when('/login', {
        templateUrl: 'templates/signup.html',
    })
    .when('/profile', {
        templateUrl: 'templates/profile.html',
    })
    .when('/maps', {
        templateUrl: 'templates/maps.html',
        controller: 'MapsCtrl',
    })
    .when('/map/:mapId/:mapTitle?', {
        templateUrl: 'templates/map.html',
        controller: 'MapCtrl',
    })
    .when('/map/:mapId/:mapTitle?/:viewType/:viewId/:viewTitle?/:viewSubtitle?', {
        templateUrl: 'templates/map.html',
        controller: 'MapCtrl',
    });

    $locationProvider
        .html5Mode(false)
        .hashPrefix('!');
}).
config(function() {
    var parseKeys = {
        app: 'QrE6nn4lKuwE9Mon6CcxH7nLQa6eScKwBgqh5oTH',
        js: 'NO1PZLeyugXkKDfDPuL8wAINf0356iTWiCVaTfGJ',
    };

    Parse.initialize(parseKeys.app, parseKeys.js);
}).

service('objectCache', function($cacheFactory) {
    // Return an object which caches or fetches objects
    return function(name, fetch) {
        var cache = $cacheFactory(name+'-cache');
        return {
            fetch: fetch,
            cache: cache,
            put: function(id, obj) {
                this.cache.put(id, obj);
            },
            get: function(id, userId) {
                var self = this;
                var objId = userId ? id+userId : id;

                // If we have no cache, then fetch the object
                if (this.cache.get(objId) === undefined) {
                    // Temporary value placeholder
                    this.put(objId, null);

                    // Fetch the value
                    this.fetch(id, userId)
                    .then(function(obj) {
                        self.put(objId, obj);
                    });
                }

                // Return the object
                return this.cache.get(objId);
            },
        };
    };
}).
service('getUserRoles', function() {
    return function() {
        if (Parse.User.current())
            return new Parse.Query('_Role')
                .equalTo('users', Parse.User.current())
                .find();
        else
            return Parse.Promise.as([]);
    };
}).
service('isEditor', function(getUserRoles) {
    return function() {
        return getUserRoles()
        .then(function(roles) {
            if (roles.find(function(role) { return role.get('name') == 'editor'; })) {
                return true;
            } else {
                return false;
            }
        });
    };
}).
service('makeURL', function(urlizeFilter) {
    // Create a URL string from various attributes of a given map
    // and view object (which can be a resource or a concept).
    // The return string should match the URL format given in
    // the routeProvider above.
    return function(mapObject, viewObject) {
        var fields = [
            mapObject.id,
            urlizeFilter(mapObject.attributes.title)
        ];
        if (viewObject) {
            fields = fields.concat([   
                viewObject.className.toLowerCase(),
                viewObject.id,
                urlizeFilter(viewObject.attributes.title),
                urlizeFilter(viewObject.attributes.subtitle)
            ]);
        }
        return '#!/map/' + fields.join('/');
    };
}).

filter('urlize', function() {
    return function(string) {
        if (string)
            return string.replace(/ /g, '-');
    };
}).
filter('deurlize', function() {
    return function(string) {
        if (string)
            return string.replace(/-/g, ' ');
    };
}).
filter('understandingClass', function() {
    return function(u) {
        if (u < 0) {
            return 'palette-alizarin';
        } else if (u == 0) {
            return 'palette-midnight-blue';
        } else if (u > 0 && u < 0.5) {
            return 'palette-belize-hole';
        } else if (u >= 0.5 && u < 1) {
            return 'palette-peter-river';
        } else if (u == 1) {
            return 'palette-turquoise';
        } else {
            return 'palette-asbestos';
        }
    };
}).
filter('understandingLabel', function() {
    return function(u) {
        if (u < 0) {
            return 'Confusing';
        } else if (u == 0) {
            return 'Unread';
        } else if (u > 0 && u < 0.5) {
            return 'Getting started';
        } else if (u > 0.5 && u < 1) {
            return 'Almost finished';
        } else if (u == 1) {
            return 'Understood';
        }
    };
}).


controller('RootCtrl', function($scope, makeURL, isEditor) {
    $scope.makeURL = makeURL;

    // Does the current user have editor permissions?
    $scope.isEditor = false;
    isEditor().then(function(editor) {
        $scope.isEditor = editor;
    });

    // Fix broken images
    $(document).bind("DOMSubtreeModified", function() {
        $('img').error(function() {
            $(this).attr('src', 'lib/Flat-UI/images/icons/png/Book.png');
        });
    });

    // Temporary user
    if (!Parse.User.current()) {
        var username = 'temp-'+Math.random().toString(36).substring(7);
        var password = Math.random().toString(36).substring(7);

        Parse.User.signUp(username, password, {
            name: 'User',
        })
        .then(function(user) {
            $scope.user = user;
        });
    } else {
        // Current user
        $scope.user = Parse.User.current();
    }
}).

controller('LoginCtrl', function($scope) {
    if (Parse.User.current()) {
        $scope.loggedIn = true;
        $scope.user = Parse.User.current().attributes;
    } else {
        $scope.loggedIn = false;
    }

    $scope.login = function() {
        Parse.User.logIn($scope.email, $scope.password)
        .then(function(user) {
            $scope.loggedIn = true;
            $scope.user = user;
        })
        .fail(function(error) {
            $scope.loggedIn = false;
            $scope.error = error;
        });
    };
});
