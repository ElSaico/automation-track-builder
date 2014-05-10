'use strict';

angular.module('automationTrackBuilderApp')
  .controller('MainCtrl', function ($scope) {
    $scope.track = {
        name: "Track",
        start: {x: 640, y: 360},
        split1: 1,
        split2: 2,
        scale: {pixels: 20, meters: 10}
    };
  });
