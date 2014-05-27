'use strict';

var STRAIGHT = 0;
var LEFT = 1;
var RIGHT = -1;

var toRadians = function(degree) {
    return (degree/180) * Math.PI;
};

angular.module('automationTrackBuilderApp')
    .factory('trackOverview', function() {
        return function(callerScope, el) {
            var caller = callerScope; // this must be very, very wrong
            var canvas = new fabric.Canvas(el, {
                containerClass: "center-block",
                selection: false
            });
            var lineDefaults = {
                originX: 'center',
                originY: 'center',
                lockMovementX: true,
                lockMovementY: true,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
                hasControls: false,
                fill: 'transparent',
                stroke: 'red',
                strokeWidth: 5
            };
            var start = new fabric.Circle({left: -10, top: -10, radius: 5, fill: 'red'});
            var corners = [];
            var cornerJointDefaults = {
                radius: 2.5,
                fill: 'red',
                selectable: false
            };
            canvas.add(start);

            return {
                draw: function() {
                    var prevSelected = caller.selected;
                    var angle = 0;
                    var position = new fabric.Point(caller.properties.start.x/2, caller.properties.start.y/2);
                    var ratio = caller.properties.scale.pixels / (2*caller.properties.scale.meters);
                    start.setPositionByOrigin(position);
                    canvas.clear();
                    corners = [];
                    caller.corners.forEach(function(corner, i) {
                        var dst, object;
                        if (corner.layout == STRAIGHT) {
                            var dx = (corner.layoutInfo*ratio) * Math.cos(toRadians(angle));
                            var dy = (corner.layoutInfo*ratio) * Math.sin(toRadians(angle));
                            dst = new fabric.Point(position.x+dx, position.y+dy);
                            object = new fabric.Line([position.x, position.y, dst.x, dst.y], lineDefaults);
                        } else {
                            var originalAngle = angle;
                            if (corner.layout == LEFT) {
                                angle = (angle - (corner.layoutInfo/2)) % 360;
                            } else {
                                angle = (angle + (corner.layoutInfo/2)) % 360;
                            }
                            var chord = 2 * corner.radius * Math.sin(toRadians(corner.layoutInfo/2));
                            var dx = (chord*ratio) * Math.cos(toRadians(angle));
                            var dy = (chord*ratio) * Math.sin(toRadians(angle));
                            if (corner.layout == LEFT) {
                                angle = (angle - (corner.layoutInfo/2)) % 360;
                            } else {
                                angle = (angle + (corner.layoutInfo/2)) % 360;
                            }
                            dst = new fabric.Point(position.x+dx, position.y+dy);

                            var ctrlChord = 2 * corner.radius * Math.sin(toRadians(corner.layoutInfo/4));
                            var ctrlAngle = originalAngle;
                            if (corner.layout == LEFT) {
                                ctrlAngle -= (corner.layoutInfo/4) % 360;
                            } else {
                                ctrlAngle += (corner.layoutInfo/4) % 360;
                            }
                            var ctrlX = position.x + (ctrlChord*ratio) * Math.cos(toRadians(ctrlAngle));
                            var ctrlY = position.y + (ctrlChord*ratio) * Math.sin(toRadians(ctrlAngle));
                            var path = [["M", position.x, position.y], ["Q", ctrlX, ctrlY, dst.x, dst.y]];
                            object = new fabric.Path(path, lineDefaults);
                        }
                        var cornerJoint = new fabric.Circle(cornerJointDefaults);
                        cornerJoint.setPositionByOrigin(dst);
                        canvas.add(cornerJoint);
                        object.pos = i;
                        object.on('selected', function(e) {
                            caller.selected = this.pos;
                            caller.$apply();
                        });
                        corners.push(object);
                        position = dst;
                    });
                    corners.forEach(function(corner) {
                        canvas.add(corner);
                    });
                    canvas.renderAll();
                    if (prevSelected >= 0)
                        canvas.setActiveObject(corners[prevSelected]);
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
        $scope.properties = {
            name: "Track",
            start: {x: 640, y: 360},
            split1: 1,
            split2: 2,
            scale: {pixels: 20, meters: 10}
        };
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

        $scope.$watch('corners', function(current, old) {
            // can be optimized by only calculating the updated corner onwards
            $scope.total2D = 0;
            $scope.total3D = 0;
            $scope.corners.forEach(function(corner) {
                if (corner.layout == STRAIGHT) {
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
        }, true);

        var setOverview = function() {
            overview = trackOverview($scope, 'track-overview');
            $scope.$watchCollection('properties.start', function(a, b) { overview.draw() });
            $scope.$watchCollection('properties.scale', function(a, b) { overview.draw() });
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
            // this doesn't work on Windows...
            //if (result.substr(0,23) != "data:text/x-lua;base64,")
            //    throw Error("Not a Lua script");
            //var script = atob(result.substr(23));
            var script = atob(result.split('base64,')[1]);
            var ast = luaparse.parse(script);
            ast.body.forEach(function(root) {
                if (root.variables[0].name == "Track") {
                    var identifiers = {STRAIGHT: 0, LEFT: 1, RIGHT: -1};
                    var result = {
                        layout: [],
                        layoutInfo: [],
                        cornerRadius: [],
                        slope: [],
                        sportiness: [],
                        camber: []
                    };
                    var corners = [];
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
                        corners.push({
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
                        $scope.properties[i] = result[i];
                    });
                    $scope.corners = corners;
                    $scope.selected = corners.length-1;
                    $scope.$apply();
                }
            });
        });
        $scope.exportFile = function() {
            if (!trackTemplate) {
                trackTemplate = angular.element("#track-template").text();
                Mustache.parse(trackTemplate);
            }
            var data = angular.copy($scope.properties);
            data.layout = [];
            data.layoutInfo = [];
            data.cornerRadius = [];
            data.slope = [];
            data.sportiness = [];
            data.camber = [];
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
