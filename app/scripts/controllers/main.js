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

        var loadFile = function(fieldId, onloadend) {
            return function() {
                if (!overview) overview = trackOverview('track-overview');
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
            if (result.substr(0,23) != "data:text/x-lua;base64,")
                throw Error("Not a Lua script");
            var script = atob(result.substr(23));
            var ast = luaparse.parse(script);
            ast.body.forEach(function(root) {
                if (root.variables[0].name == "Track") {
                    var identifiers = {STRAIGHT: 0, LEFT: 1, RIGHT: -1};
                    var result = {
                        start: {},
                        scale: {},
                        layout: [],
                        layoutInfo: [],
                        cornerRadius: [],
                        slope: [],
                        sportiness: [],
                        camber: [],
                        corners: []
                    };
                    root.init[0].fields.forEach(function(field) {
                        switch(field.key.name) {
                            case "Name": result.name = field.value.value; break;
                            case "Split1": result.split1 = field.value.value; break;
                            case "Split2": result.split2 = field.value.value; break;
                            case "Start":
                                result.start = {
                                    x: field.value.fields[0].value.value,
                                    y: field.value.fields[1].value.value
                                };
                                break;
                            case "Scale":
                                if (field.value.operator != '/')
                                    throw Error("Scale must be a pixels/length division");
                                result.scale = {
                                    pixels: field.value.left.value,
                                    meters: field.value.right.value
                                };
                                break;
                            case "Layout":
                                field.value.fields.forEach(function(innerField) {
                                    if (innerField.value.type == "Identifier")
                                        result.layout.push(identifiers[innerField.value.name]);
                                    else if (innerField.value.type == "NumericLiteral")
                                        result.layout.push(innerField.value.value);
                                });
                                break;
                            case "LayoutInfo":
                                field.value.fields.forEach(function(innerField) {
                                    result.layoutInfo.push(innerField.value.value);
                                });
                                break;
                            case "CornerRadius":
                                field.value.fields.forEach(function(innerField) {
                                    result.cornerRadius.push(innerField.value.value);
                                });
                                break;
                            case "Slope":
                                field.value.fields.forEach(function(innerField) {
                                    if (innerField.value.operator == '-')
                                        result.slope.push(-innerField.value.argument.value);
                                    else
                                        result.slope.push(innerField.value.value);
                                });
                                break;
                            case "Sportiness":
                                field.value.fields.forEach(function(innerField) {
                                    result.sportiness.push(innerField.value.value);
                                });
                                break;
                            case "Camber":
                                field.value.fields.forEach(function(innerField) {
                                    if (innerField.value.operator == '-')
                                        result.camber.push(-innerField.value.argument.value);
                                    else
                                        result.camber.push(innerField.value.value);
                                });
                                break;
                        }
                    });
                    for (var i = 0; i < result.layout.length; i++) {
                        result.corners.push({
                            layout: result.layout[i],
                            layoutInfo: result.layoutInfo[i],
                            radius: result.cornerRadius[i],
                            slope: result.slope[i],
                            sportiness: result.sportiness[i],
                            camber: result.camber[i]
                        });
                    };
                    delete result.layout;
                    delete result.layoutInfo;
                    delete result.cornerRadius;
                    delete result.slope;
                    delete result.sportiness;
                    delete result.camber;
                    Object.keys(result).forEach(function(i) {
                        $scope[i] = result[i];
                    });
                    $scope.selected = result.corners.length-1;
                    $scope.$apply();
                }
            });
        });

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
