angular.module('coursestitch', [
    'ngRoute', 'ngAnimate', 'parse-angular',
    'coursestitch-maps', 'coursestitch-resources',
    'coursestitch-components', 'satellizer'
]).

config(function($routeProvider, $locationProvider) {
    $routeProvider
    .when('/', {
        templateUrl: 'templates/home.html',
    })
    .when('/login', {
        templateUrl: 'templates/login.html',
    })
    .when('/signup', {
        templateUrl: 'templates/signup.html',
        controller: 'SignupCtrl',
    })
    .when('/profile', {
        templateUrl: 'templates/profile.html',
    })
    .when('/about', {
        templateUrl: 'templates/about-us.html',
    })
    .when('/contact', {
        templateUrl: 'templates/contact-us.html',
    })
    .when('/maps', {
        templateUrl: 'templates/maps.html',
        controller: 'MapsCtrl',
    })
    .when('/map/:mapId/:mapTitle?', {
        templateUrl: 'templates/map.html',
        controller: 'MapCtrl',
    })
    .when('/map/:mapId/:mapTitle?/next', {
        templateUrl: 'templates/map.html',
        controller: 'MapNextCtrl',
    })
    .when('/map/:mapId/:mapTitle?/:viewType/:viewId/:viewTitle?/:viewSubtitle?', {
        templateUrl: 'templates/map.html',
        controller: 'MapCtrl',
    })
    .when('/map/:mapId/:mapTitle?/:viewType/:viewId/:viewTitle?/:viewSubtitle?/view', {
        templateUrl: 'templates/external.html',
        controller: 'ExternalCtrl',
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
config(function($authProvider) {
    $authProvider.github({
        clientId: '06ab2e10e5bb81f8841e',
        scope: ['user:email'],
        optionalUrlParams: ['scope'],
    });
    $authProvider.facebook({
        clientId: '645904488858229',
        // override satellizer's default redirect URI to make it work
        // properly with our site
        redirectUri: window.location.origin + '/#!/',
    });
    $authProvider.google({
        clientId: '580207549424-oss6pia8ldpj7rps65afh18johr1vp2q.apps.googleusercontent.com',
    });
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
                return obj;
            },
            get: function(id, userId) {
                var self = this;
                var objId = userId ? id+userId : id;

                // If we have no cache, then fetch the object
                if (this.cache.get(objId) === undefined) {
                    // Promise to fetch the value
                    var promise = this.fetch(id, userId); 
                    self.put(objId, promise);
                }

                // Return the object
                return this.cache.get(objId);
            },
            putGet: function(id, obj) {
                var cache = this.cache.get(id);

                // Return the cache if it exists
                if (cache)
                    return cache;
                // Otherwise cache the given object
                else
                    return this.put(id, obj);
            }
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
service('makeURL', function(urlizeFilter) {
    // Create a URL string from various attributes of a given map
    // and view object (which can be a resource or a concept).
    // The return string should match the URL format given in
    // the routeProvider above.
    return function(mapObject, viewObject) {
        var fields = [];
        if (mapObject) {
            fields = fields.concat([
                mapObject.id,
                urlizeFilter(mapObject.attributes.title)
            ]);
        }
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
filter('result', function() {
    // Return the result of a Parse promise
    return function(promise) {
        if (promise && promise._resolved)
            return promise._result[0]
        else
            return undefined;
    };
}).
filter('resourceImageURL', function() {
    return function(resource) {
        var type = resource.attributes.type;
        if (type === 'video') {
            return 'images/icons/camera6.svg';
        } else {
            return 'images/icons/leaf5.svg';
        }
    };
}).
filter('understandingClass', function() {
    return function(u) {
        if (u < 0) {
            return 'understanding understanding-confusing';
        } else if (u == 0) {
            return 'understanding understanding-unread';
        } else if (u > 0 && u < 0.5) {
            return 'understanding understanding-starting';
        } else if (u >= 0.5 && u < 1) {
            return 'understanding understanding-finishing';
        } else if (u == 1) {
            return 'understanding understanding-understood';
        } else {
            return 'understanding';
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


controller('RootCtrl', function($scope, $auth, $location, $window, makeURL, createMap) {
    $scope.makeURL = makeURL;
    // Creates a new map and the goes to its URL
    $scope.createMap = function(user) {
        createMap(user)
        .then(function(map) {
            // Update URL
            var url = $scope.makeURL(map).slice(2);
            $location.path(url, true);
        });
    };

    var logout = function() {
        $scope.user = null;
        Parse.User.logOut();
        $auth.logout(); // log out of satellizer
        $window.location.href = '/';
    };
    $scope.logout = logout;

    var setUser = function(user) {
        $scope.user = user;
    };
    $scope.setUser = setUser;

    // Function to use ng-click as a link
    // This is useful for linking block tags which can't be wrapped in anchor tags
    $scope.goTo = function(url) {
        window.location = url;
    };

    // Temporary user
    if (!Parse.User.current()) {
        var username = 'temp-'+Math.random().toString(36).substring(7);
        var password = Math.random().toString(36).substring(7);

        Parse.User.signUp(username, password, {
            name: 'Temporary User',
            temporary: true,
        })
        .then(function(user) {
            $scope.user = user;
            $auth.login({
                email: username,
                password: password,
                sessionToken: user.getSessionToken(),
            });
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
}).
controller('SignupCtrl', function($scope, $auth) {
    $scope.authenticate = function(provider) {
        $auth.authenticate(provider).then(function(res) {
            return Parse.User.become(res.data.token);
        })
        .then(function(user) {
            return user.fetch();
        })
        .then(function(user) {
            $scope.setUser(user);
        });
    };
});
