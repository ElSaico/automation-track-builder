'use strict';

var toRadians = function(degree) {
    return (degree/180) * Math.PI;
};

angular.module('automationTrackBuilderApp')
    .controller('MainCtrl', ['$scope', 'directions', 'track', 'trackOverview',
                             function ($scope, directions, track, trackOverview) {
        var overview;
        var trackTemplate;
        $scope.track = track;

        $scope.$on('$includeContentLoaded', function() {
            overview = trackOverview('track-overview');
            $scope.$watchCollection('track.start', function(a, b) { overview.draw(); });
            $scope.$watchCollection('track.scale', function(a, b) { overview.draw(); });
            $scope.$watch('track.corners', function(a, b) {
                // can be optimized by only calculating the updated corner onwards
                $scope.total2D = 0;
                $scope.total3D = 0;
                track.corners.forEach(function(corner) {
                    if (corner.layout == directions.STRAIGHT) {
                        corner.length2D = corner.layoutInfo;
                    } else {
                        corner.length2D = corner.radius * toRadians(corner.layoutInfo);
                    }
                    var slopeAngle = Math.atan(corner.slope/100);
                    corner.length3D = corner.length2D / Math.cos(slopeAngle);
                    corner.distance2D = $scope.total2D;
                    corner.distance3D = $scope.total3D;
                    $scope.total2D += corner.length2D;
                    $scope.total3D += corner.length3D;
                });
                overview.draw();
            }, true);
            trackTemplate = angular.element("#track-template").text();
            Mustache.parse(trackTemplate);
        });

        var loadFile = function(fieldId, onloadend) {
            return function() {
                var field = document.getElementById(fieldId);
                var reader = new FileReader();
                reader.onloadend = function (e) {
                    onloadend(e.target.result);
                };
                field.onchange = function (e) {
                    reader.readAsDataURL(e.target.files[0]);
                };
                field.click();
            };
        };
        $scope.loadBG = loadFile('background-file', function(result) {
            var imgObj = new Image();
            imgObj.src = result;
            imgObj.onload = function() {
                overview.setBackground(imgObj);
            };
        });
        $scope.importFile = loadFile('import-file', function(result) {
            track.parse(result);
            $scope.$apply();
        });
        $scope.exportFile = function() {
            var data = angular.copy(track);
            data.layout = [];
            data.layoutInfo = [];
            data.cornerRadius = [];
            data.slope = [];
            data.sportiness = [];
            data.camber = [];
            track.corners.forEach(function(corner) {
                switch(corner.layout) {
                    case  0: data.layout.push("STRAIGHT"); break;
                    case  1: data.layout.push("LEFT"); break;
                    case -1: data.layout.push("RIGHT"); break;
                }
                data.layoutInfo.push(corner.layoutInfo);
                data.cornerRadius.push(corner.radius);
                data.slope.push(corner.slope);
                data.sportiness.push(corner.sportiness);
                data.camber.push(corner.camber);
            });
            var trackText = Mustache.render(trackTemplate, data);
            window.open("data:text/x-lua;base64,"+btoa(trackText), '_blank');
        };
    }]);
