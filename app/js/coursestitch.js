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
value('map', {
    title: "Learn to program",
    resources: [{
        title: "Angry Birds Hour of Code",
        subtitle: "Level 1",
        url: "http://learn.code.org/hoc/1",
        image: "http://learn.code.org/blockly/media/skins/birds/small_static_avatar.png",
        summary: "Can you help me to catch the naughty pig? Stack a couple of \"move forward\" blocks together and press \"Run\" to help me get there.",
        teaches: ["visual programming"],
        requires: ["reading"],
    }],
}).
controller('mapsCtrl', function($scope, maps) {
    $scope.maps = maps;
}).
controller('viewerCtrl', function($scope, map) {
    $scope.map = map;
    $scope.resource = map.resources[0];
    $scope.tags = ["teaches", "requires"];
});
