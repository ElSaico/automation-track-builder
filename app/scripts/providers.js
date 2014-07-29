'use strict';

angular.module('automationTrackBuilderApp')
    .factory('trackOverview', ['$timeout', 'directions', 'track', function($timeout, directions, track) {
        return function(el) {
            var canvas = new fabric.Canvas(el, {
                containerClass: "center-block",
                selection: false
            });
            canvas.setBackgroundColor('gray');
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
                    var prevSelected = track.selected;
                    var angle = 0;
                    var position = new fabric.Point(track.start.x/2, track.start.y/2);
                    var ratio = track.scale.pixels / (2*track.scale.meters);
                    start.setPositionByOrigin(position);
                    canvas.clear();
                    corners = [];
                    track.corners.forEach(function(corner, i) {
                        var dst, object;
                        if (corner.layout == directions.STRAIGHT) {
                            var dx = (corner.layoutInfo*ratio) * Math.cos(toRadians(angle));
                            var dy = (corner.layoutInfo*ratio) * Math.sin(toRadians(angle));
                            dst = new fabric.Point(position.x+dx, position.y+dy);
                            object = new fabric.Line([position.x, position.y, dst.x, dst.y], lineDefaults);
                        } else {
                            var originalAngle = angle;
                            if (corner.layout == directions.LEFT) {
                                angle = (angle - (corner.layoutInfo/2)) % 360;
                            } else {
                                angle = (angle + (corner.layoutInfo/2)) % 360;
                            }
                            var chord = 2 * corner.radius * Math.sin(toRadians(corner.layoutInfo/2));
                            var dx = (chord*ratio) * Math.cos(toRadians(angle));
                            var dy = (chord*ratio) * Math.sin(toRadians(angle));
                            if (corner.layout == directions.LEFT) {
                                angle = (angle - (corner.layoutInfo/2)) % 360;
                            } else {
                                angle = (angle + (corner.layoutInfo/2)) % 360;
                            }
                            dst = new fabric.Point(position.x+dx, position.y+dy);

                            var ctrlChord = 2 * corner.radius * Math.sin(toRadians(corner.layoutInfo/4));
                            var ctrlAngle = originalAngle;
                            if (corner.layout == directions.LEFT) {
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
                            var self = this;
                            $timeout(function() {
                                track.selected = self.pos;
                            });
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
    }]);

angular.module('automationTrackBuilderApp')
    .service('track', ['directions', function(directions) {
         var defaultCorner = {
            layout: 0,
            layoutInfo: 100,
            radius: 0,
            slope: 0,
            camber: 0,
            sportiness: 0
        };

        this.name = "Track";
        this.start = {x: 640, y: 360};
        this.split1 = 1;
        this.split2 = 2;
        this.scale = {pixels: 20, meters: 10};
        this.corners = [defaultCorner];
        this.selected = 0;
        //this.selectCorner = function(val) { selected = val; };
        //this.selectedCorner = function() { return corners[selected]; };
        this.parse = function(result) {
            var self = this;
            var script = atob(result.split('base64,')[1]);
            var ast = luaparse.parse(script);
            ast.body.forEach(function(root) {
                if (root.variables[0].name == "Track") {
                    var result = {
                        layout: [],
                        layoutInfo: [],
                        cornerRadius: [],
                        slope: [],
                        sportiness: [],
                        camber: []
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
                                        result.layout.push(directions[innerField.value.name]);
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
                    self.corners.length = 0;
                    for (var i = 0; i < result.layout.length; i++) {
                        self.corners.push({
                            layout: result.layout[i],
                            layoutInfo: result.layoutInfo[i],
                            radius: result.cornerRadius[i],
                            slope: result.slope[i],
                            sportiness: result.sportiness[i],
                            camber: result.camber[i]
                        });
                    };
                    self.name = result.name;
                    self.split1 = result.split1;
                    self.split2 = result.split2;
                    self.start = result.start;
                    self.scale = result.scale;
                    self.selected = self.corners.length-1;
                }
            });
        };
        this.cornerPush = function() {
            var corner = angular.copy(defaultCorner);
            var newlen = this.corners.push(corner);
            this.selected = newlen-1;
        };
        this.cornerPop = function() {
            this.corners.pop();
            this.selected = Math.min(this.selected, this.corners.length-1);
        };
        this.cornerStraight = function() {
            if (this.corners[this.selected].layout != directions.STRAIGHT) {
                this.corners[this.selected].layoutInfo = this.corners[this.selected].radius;
                this.corners[this.selected].radius = 0;
            }
            this.corners[this.selected].layout = directions.STRAIGHT;
        };
        this.cornerLeft = function() {
            if (this.corners[this.selected].layout == directions.STRAIGHT) {
                this.corners[this.selected].radius = this.corners[this.selected].layoutInfo;
                this.corners[this.selected].layoutInfo = 90;
            }
            this.corners[this.selected].layout = directions.LEFT;
        };
        this.cornerRight = function() {
            if (this.corners[this.selected].layout == directions.STRAIGHT) {
                this.corners[this.selected].radius = this.corners[this.selected].layoutInfo;
                this.corners[this.selected].layoutInfo = 90;
            }
            this.corners[this.selected].layout = directions.RIGHT;
        };
    }]);
