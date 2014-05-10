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
        var overview;
        $scope.track = {
            name: "Track",
            start: {x: 640, y: 360},
            split1: 1,
            split2: 2,
            scale: {pixels: 20, meters: 10},
            corners: []
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
        }
    });
