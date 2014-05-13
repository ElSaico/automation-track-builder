'use strict';

var STRAIGHT = 0;
var LEFT = 1;
var RIGHT = -1;

angular.module('automationTrackBuilderApp')
    .factory('trackOverview', function() {
        return function(callerScope, el) {
            var caller = callerScope; // this must be very, very wrong
            var canvas = new fabric.Canvas(el, {containerClass: "center-block"});
            var lineDefaults = {
                originX: 'center',
                originY: 'center',
                lockMovementX: true,
                lockMovementY: true,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
                hasControls: false,
                fill: 'red',
                stroke: 'red',
                strokeWidth: 5
            };
            var start = new fabric.Circle({left: -10, top: -10, radius: 5, fill: 'red'});
            var corners = [];
            canvas.add(start);
            canvas.on('selection:cleared', function() {
                caller.selected = caller.corners.length-1;
                caller.$apply();
            });

            return {
                draw: function() {
                    var angle = 0;
                    var position = new fabric.Point(caller.start.x/2, caller.start.y/2);
                    var ratio = caller.scale.pixels / (2*caller.scale.meters);
                    start.setPositionByOrigin(position);
                    corners.forEach(function(corner, i) {
                        corner.remove();
                        delete corners[i];
                    });
                    caller.corners.forEach(function(corner, i) {
                        var dst, object;
                        if (corner.layout == STRAIGHT) {
                            var dx = (corner.layoutInfo*ratio) * Math.cos(angle*Math.PI/180);
                            var dy = (corner.layoutInfo*ratio) * Math.sin(angle*Math.PI/180);
                            dst = new fabric.Point(position.x+dx, position.y+dy);
                            object = new fabric.Line([position.x, position.y, dst.x, dst.y], lineDefaults);
                        } else {
                            if (corner.layout == LEFT) {
                                angle = (angle - (corner.layoutInfo/2)) % 360;
                            } else {
                                angle = (angle + (corner.layoutInfo/2)) % 360;
                            }
                            var chord = 2 * corner.radius * Math.sin(corner.layoutInfo*Math.PI/360);
                            var dx = (chord*ratio) * Math.cos(angle*Math.PI/180);
                            var dy = (chord*ratio) * Math.sin(angle*Math.PI/180);
                            if (corner.layout == LEFT) {
                                angle = (angle - (corner.layoutInfo/2)) % 360;
                            } else {
                                angle = (angle + (corner.layoutInfo/2)) % 360;
                            }
                            dst = new fabric.Point(position.x+dx, position.y+dy);
                            // TODO: calculate (xm, ym) and replace line with quadratic curve
                            object = new fabric.Line([position.x, position.y, dst.x, dst.y], lineDefaults);
                        }
                        object.pos = i;
                        object.on('selected', function(e) {
                            caller.selected = this.pos;
                            caller.$apply();
                        });
                        corners.push(object);
                        canvas.add(object);
                        position = dst;
                    });
                    canvas.renderAll();
                },
                setBackground: function(imgObj) {
                    var img = new fabric.Image(imgObj, {width: canvas.width, height: canvas.height});
                    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
                }
            };
        };
    }).controller('MainCtrl', function ($scope, trackOverview) {
        var overview;
        var trackTemplate;
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

        var setOverview = function() {
            overview = trackOverview($scope, 'track-overview');
            $scope.$watchCollection('start', function(a, b) { overview.draw() });
            $scope.$watchCollection('scale', function(a, b) { overview.draw() });
            $scope.$watch('corners', function(a, b) { overview.draw() }, true);
        }

        var loadFile = function(fieldId, onloadend) {
            return function() {
                if (!overview) setOverview();
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
        $scope.exportFile = function() {
            if (!trackTemplate) {
                trackTemplate = angular.element("#track-template").text();
                Mustache.parse(trackTemplate);
            }
            var data = {
                name: $scope.name,
                start: $scope.start,
                split1: $scope.split1,
                split2: $scope.split2,
                scale: $scope.scale,
                layout: [],
                layoutInfo: [],
                cornerRadius: [],
                slope: [],
                sportiness: [],
                camber: []
            };
            $scope.corners.forEach(function(corner) {
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
            var track = Mustache.render(trackTemplate, data);
            window.open("data:text/x-lua;base64,"+btoa(track), '_blank');
        };

        $scope.cornerPush = function() {
            var corner = angular.copy($scope.defaultCorner);
            var newlen = $scope.corners.push(corner);
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
