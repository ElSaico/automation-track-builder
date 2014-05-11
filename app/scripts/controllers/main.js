'use strict';

angular.module('automationTrackBuilderApp')
    .factory('trackOverview', function($rootScope) {
        return function(el) {
            var canvas = new fabric.Canvas(el);
            var background = new fabric.Image();
            background.set({
                angle: 0,
                width: 640,
                height: 360,
                selectable: false
            });
            canvas.centerObject(background);
            canvas.add(background);

            return {
                setBackground: function(imgObj) {
                    background.setElement(imgObj);
                    canvas.renderAll();
                }
            };
        };
    }).controller('MainCtrl', function ($scope, trackOverview) {
        var STRAIGHT = 0;
        var LEFT = 1;
        var RIGHT = -1;

        var overview;
        $scope.name = "Track";
        $scope.start = {x: 640, y: 360};
        $scope.split1 = 1;
        $scope.split2 = 2;
        $scope.scale = {pixels: 20, meters: 10};
        $scope.corners = [];
        $scope.selected = -1;
        $scope.defaultCorner = {
            layout: 0,
            layoutInfo: 100,
            radius: 0,
            slope: 0,
            camber: 0,
            sportiness: 0
        };

        $scope.loadBG = function() {
            if (!overview) overview = trackOverview('track-overview');
            var field = document.getElementById('background-file');
            var reader = new FileReader();
            reader.onloadend = function(e) {
                var imgObj = new Image();
                imgObj.src = e.target.result;
                imgObj.onload = function() {
                    overview.setBackground(imgObj);
                };
            };
            field.onchange = function(e) {
                reader.readAsDataURL(e.target.files[0]);
            };
            field.click();
        };

        $scope.cornerPush = function() {
            var newlen = $scope.corners.push($scope.defaultCorner);
            $scope.selected = newlen-1;
        };
        $scope.cornerPop = function() {
            $scope.corners.pop();
            $scope.selected = Math.min($scope.selected, $scope.corners.length-1);
        };

        $scope.cornerStraight = function() {
            if ($scope.corners[$scope.selected].layout != STRAIGHT) {
                $scope.corners[$scope.selected].layoutInfo = $scope.corners[$scope.selected].radius;
                $scope.corners[$scope.selected].radius = 0;
            }
            $scope.corners[$scope.selected].layout = STRAIGHT;
        };
        $scope.cornerLeft = function() {
            if ($scope.corners[$scope.selected].layout == STRAIGHT) {
                $scope.corners[$scope.selected].radius = $scope.corners[$scope.selected].layoutInfo;
                $scope.corners[$scope.selected].layoutInfo = 90;
            }
            $scope.corners[$scope.selected].layout = LEFT;
        };
        $scope.cornerRight = function() {
            if ($scope.corners[$scope.selected].layout == STRAIGHT) {
                $scope.corners[$scope.selected].radius = $scope.corners[$scope.selected].layoutInfo;
                $scope.corners[$scope.selected].layoutInfo = 90;
            }
            $scope.corners[$scope.selected].layout = RIGHT;
        };
    });
