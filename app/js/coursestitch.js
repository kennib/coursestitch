angular.module('coursestitch', []).
value('maps', [{
    title: "Learn to Program",
}, {
    title: "Program an Arduino",
}, {
    title: "Create a website",
}, {
    title: "Make an App",
}]).
controller('mapsCtrl', function($scope, maps) {
    $scope.maps = maps;
});
