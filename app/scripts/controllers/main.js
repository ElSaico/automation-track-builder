'use strict';

var toRadians = function(degree) {
    return (degree/180) * Math.PI;
};

angular.module('automationTrackBuilderApp')
    .controller('MainCtrl', ['$scope', 'directions', 'track', 'trackOverview',
                             function ($scope, directions, track, trackOverview) {
        var trackTemplate;
        $scope.track = track;

        $scope.$on('$includeContentLoaded', function() {
            $scope.overview = trackOverview('track-overview');
            $scope.onTrackUpdate();
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
                $scope.overview.setBackground(imgObj);
            };
        });
        $scope.importFile = loadFile('import-file', function(result) {
            track.parse(result);
            $scope.onTrackUpdate();
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
                    case  0:
                        data.layout.push("STRAIGHT");
                        if (track.pixelMode)
                            data.layoutInfo.push(corner.layoutInfo/track.getRatio());
                        else
                            data.layoutInfo.push(corner.layoutInfo);
                        data.cornerRadius.push(0);
                        break;
                    case  1:
                        data.layout.push("LEFT");
                        data.layoutInfo.push(corner.layoutInfo);
                        if (track.pixelMode)
                            data.cornerRadius.push(corner.radius/track.getRatio());
                        else
                            data.cornerRadius.push(corner.radius);
                        break;
                    case -1:
                        data.layout.push("RIGHT");
                        data.layoutInfo.push(corner.layoutInfo);
                        if (track.pixelMode)
                            data.cornerRadius.push(corner.radius/track.getRatio());
                        else
                            data.cornerRadius.push(corner.radius);
                        break;
                }
                data.slope.push(corner.slope);
                data.sportiness.push(corner.sportiness);
                data.camber.push(corner.camber);
            });
            var trackText = Mustache.render(trackTemplate, data);
            window.open("data:text/x-lua;base64,"+btoa(trackText), '_blank');
        };
        $scope.onTrackUpdate = function() {
            $scope.total2D = 0;
            $scope.total3D = 0;
            track.corners.forEach(function(corner) {
                if (corner.layout == directions.STRAIGHT) {
                    corner.length2D = corner.layoutInfo;
                } else {
                    corner.length2D = corner.radius * toRadians(corner.layoutInfo);
                }
                if (track.pixelMode)
                    corner.length2D /= track.getRatio();
                var slopeAngle = Math.atan(corner.slope/100);
                corner.length3D = corner.length2D / Math.cos(slopeAngle);
                corner.distance2D = $scope.total2D;
                corner.distance3D = $scope.total3D;
                $scope.total2D += corner.length2D;
                $scope.total3D += corner.length3D;
            });
            $scope.overview.draw();
        };
    }]);
