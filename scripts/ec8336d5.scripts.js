"use strict";angular.module("automationTrackBuilderApp",[]);var STRAIGHT=0,LEFT=1,RIGHT=-1;angular.module("automationTrackBuilderApp").factory("trackOverview",function(){return function(a,b){var c=a,d=new fabric.Canvas(b,{containerClass:"center-block",selection:!1}),e={originX:"center",originY:"center",lockMovementX:!0,lockMovementY:!0,lockRotation:!0,lockScalingX:!0,lockScalingY:!0,hasControls:!1,fill:"transparent",stroke:"red",strokeWidth:5},f=new fabric.Circle({left:-10,top:-10,radius:5,fill:"red"}),g=[],h={radius:2.5,fill:"red",selectable:!1};return d.add(f),{draw:function(){var a=c.selected,b=0,i=new fabric.Point(c.start.x/2,c.start.y/2),j=c.scale.pixels/(2*c.scale.meters);f.setPositionByOrigin(i),d.clear(),c.corners.forEach(function(a,f){var k,l;if(a.layout==STRAIGHT){var m=a.layoutInfo*j*Math.cos(b*Math.PI/180),n=a.layoutInfo*j*Math.sin(b*Math.PI/180);k=new fabric.Point(i.x+m,i.y+n),l=new fabric.Line([i.x,i.y,k.x,k.y],e)}else{var o=b;b=a.layout==LEFT?(b-a.layoutInfo/2)%360:(b+a.layoutInfo/2)%360;var p=2*a.radius*Math.sin(a.layoutInfo*Math.PI/360),m=p*j*Math.cos(b*Math.PI/180),n=p*j*Math.sin(b*Math.PI/180);b=a.layout==LEFT?(b-a.layoutInfo/2)%360:(b+a.layoutInfo/2)%360,k=new fabric.Point(i.x+m,i.y+n);var q=a.radius*(1-Math.cos(a.layoutInfo*Math.PI/360)),r=Math.atan(2*q/p);r=a.layout==LEFT?o*Math.PI/180-r:o*Math.PI/180+r;var s=i.x+q*j*Math.cos(r),t=i.y+q*j*Math.sin(r),u="M "+i.x+" "+i.y+" Q "+s+", "+t+", "+k.x+", "+k.y;l=new fabric.Path(u,e)}var v=new fabric.Circle(h);v.setPositionByOrigin(k),d.add(v),l.pos=f,l.on("selected",function(){c.selected=this.pos,c.$apply()}),g[f]=l,i=k}),g.forEach(function(a){d.add(a)}),d.renderAll(),d.setActiveObject(g[a])},setBackground:function(a){var b=new fabric.Image(a,{width:d.width,height:d.height});d.setBackgroundImage(b,d.renderAll.bind(d))}}}}).controller("MainCtrl",["$scope","trackOverview",function(a,b){var c,d;a.name="Track",a.start={x:640,y:360},a.split1=1,a.split2=2,a.scale={pixels:20,meters:10},a.corners=[],a.selected=-1,a.defaultCorner={layout:0,layoutInfo:100,radius:0,slope:0,camber:0,sportiness:0};var e=function(){c=b(a,"track-overview"),a.$watchCollection("start",function(){c.draw()}),a.$watchCollection("scale",function(){c.draw()}),a.$watch("corners",function(){c.draw()},!0)},f=function(a,b){return function(){c||e();var d=document.getElementById(a),f=new FileReader;f.onloadend=function(a){b(a.target.result)},d.onchange=function(a){f.readAsDataURL(a.target.files[0])},d.click()}};a.loadBG=f("background-file",function(a){var b=new Image;b.src=a,b.onload=function(){c.setBackground(b)}}),a.importFile=f("import-file",function(b){var c=atob(b.split("base64,")[1]),d=luaparse.parse(c);d.body.forEach(function(b){if("Track"==b.variables[0].name){var c={STRAIGHT:0,LEFT:1,RIGHT:-1},d={start:{},scale:{},layout:[],layoutInfo:[],cornerRadius:[],slope:[],sportiness:[],camber:[],corners:[]};b.init[0].fields.forEach(function(a){switch(a.key.name){case"Name":d.name=a.value.value;break;case"Split1":d.split1=a.value.value;break;case"Split2":d.split2=a.value.value;break;case"Start":d.start={x:a.value.fields[0].value.value,y:a.value.fields[1].value.value};break;case"Scale":if("/"!=a.value.operator)throw Error("Scale must be a pixels/length division");d.scale={pixels:a.value.left.value,meters:a.value.right.value};break;case"Layout":a.value.fields.forEach(function(a){"Identifier"==a.value.type?d.layout.push(c[a.value.name]):"NumericLiteral"==a.value.type&&d.layout.push(a.value.value)});break;case"LayoutInfo":a.value.fields.forEach(function(a){d.layoutInfo.push(a.value.value)});break;case"CornerRadius":a.value.fields.forEach(function(a){d.cornerRadius.push(a.value.value)});break;case"Slope":a.value.fields.forEach(function(a){d.slope.push("-"==a.value.operator?-a.value.argument.value:a.value.value)});break;case"Sportiness":a.value.fields.forEach(function(a){d.sportiness.push(a.value.value)});break;case"Camber":a.value.fields.forEach(function(a){d.camber.push("-"==a.value.operator?-a.value.argument.value:a.value.value)})}});for(var e=0;e<d.layout.length;e++)d.corners.push({layout:d.layout[e],layoutInfo:d.layoutInfo[e],radius:d.cornerRadius[e],slope:d.slope[e],sportiness:d.sportiness[e],camber:d.camber[e]});delete d.layout,delete d.layoutInfo,delete d.cornerRadius,delete d.slope,delete d.sportiness,delete d.camber,Object.keys(d).forEach(function(b){a[b]=d[b]}),a.selected=d.corners.length-1,a.$apply()}})}),a.exportFile=function(){d||(d=angular.element("#track-template").text(),Mustache.parse(d));var b={name:a.name,start:a.start,split1:a.split1,split2:a.split2,scale:a.scale,layout:[],layoutInfo:[],cornerRadius:[],slope:[],sportiness:[],camber:[]};a.corners.forEach(function(a){switch(a.layout){case 0:b.layout.push("STRAIGHT");break;case 1:b.layout.push("LEFT");break;case-1:b.layout.push("RIGHT")}b.layoutInfo.push(a.layoutInfo),b.cornerRadius.push(a.radius),b.slope.push(a.slope),b.sportiness.push(a.sportiness),b.camber.push(a.camber)});var c=Mustache.render(d,b);window.open("data:text/x-lua;base64,"+btoa(c),"_blank")},a.cornerPush=function(){var b=angular.copy(a.defaultCorner),c=a.corners.push(b);a.selected=c-1},a.cornerPop=function(){a.corners.pop(),a.selected=Math.min(a.selected,a.corners.length-1)},a.cornerStraight=function(){a.corners[a.selected].layout!=STRAIGHT&&(a.corners[a.selected].layoutInfo=a.corners[a.selected].radius,a.corners[a.selected].radius=0),a.corners[a.selected].layout=STRAIGHT},a.cornerLeft=function(){a.corners[a.selected].layout==STRAIGHT&&(a.corners[a.selected].radius=a.corners[a.selected].layoutInfo,a.corners[a.selected].layoutInfo=90),a.corners[a.selected].layout=LEFT},a.cornerRight=function(){a.corners[a.selected].layout==STRAIGHT&&(a.corners[a.selected].radius=a.corners[a.selected].layoutInfo,a.corners[a.selected].layoutInfo=90),a.corners[a.selected].layout=RIGHT}}]);