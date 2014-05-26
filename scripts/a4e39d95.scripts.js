"use strict";angular.module("automationTrackBuilderApp",[]);var STRAIGHT=0,LEFT=1,RIGHT=-1;angular.module("automationTrackBuilderApp").factory("trackOverview",function(){var a=function(a){return a/180*Math.PI};return function(b,c){var d=b,e=new fabric.Canvas(c,{containerClass:"center-block",selection:!1}),f={originX:"center",originY:"center",lockMovementX:!0,lockMovementY:!0,lockRotation:!0,lockScalingX:!0,lockScalingY:!0,hasControls:!1,fill:"transparent",stroke:"red",strokeWidth:5},g=new fabric.Circle({left:-10,top:-10,radius:5,fill:"red"}),h=[],i={radius:2.5,fill:"red",selectable:!1};return e.add(g),{draw:function(){var b=d.selected,c=0,j=new fabric.Point(d.properties.start.x/2,d.properties.start.y/2),k=d.properties.scale.pixels/(2*d.properties.scale.meters);g.setPositionByOrigin(j),e.clear(),h=[],d.corners.forEach(function(b,g){var l,m;if(b.layout==STRAIGHT){var n=b.layoutInfo*k*Math.cos(a(c)),o=b.layoutInfo*k*Math.sin(a(c));l=new fabric.Point(j.x+n,j.y+o),m=new fabric.Line([j.x,j.y,l.x,l.y],f)}else{var p=c;c=b.layout==LEFT?(c-b.layoutInfo/2)%360:(c+b.layoutInfo/2)%360;var q=2*b.radius*Math.sin(a(b.layoutInfo/2)),n=q*k*Math.cos(a(c)),o=q*k*Math.sin(a(c));c=b.layout==LEFT?(c-b.layoutInfo/2)%360:(c+b.layoutInfo/2)%360,l=new fabric.Point(j.x+n,j.y+o);var r=2*b.radius*Math.sin(a(b.layoutInfo/4)),s=p;b.layout==LEFT?s-=b.layoutInfo/4%360:s+=b.layoutInfo/4%360;var t=j.x+r*k*Math.cos(a(s)),u=j.y+r*k*Math.sin(a(s)),v=[["M",j.x,j.y],["Q",t,u,l.x,l.y]];m=new fabric.Path(v,f)}var w=new fabric.Circle(i);w.setPositionByOrigin(l),e.add(w),m.pos=g,m.on("selected",function(){d.selected=this.pos,d.$apply()}),h.push(m),j=l}),h.forEach(function(a){e.add(a)}),e.renderAll(),b>=0&&e.setActiveObject(h[b])},setBackground:function(a){var b=new fabric.Image(a,{width:e.width,height:e.height});e.setBackgroundImage(b,e.renderAll.bind(e))}}}}).controller("MainCtrl",["$scope","trackOverview",function(a,b){var c,d;a.properties={name:"Track",start:{x:640,y:360},split1:1,split2:2,scale:{pixels:20,meters:10}},a.corners=[],a.selected=-1,a.defaultCorner={layout:0,layoutInfo:100,radius:0,slope:0,camber:0,sportiness:0};var e=function(){c=b(a,"track-overview"),a.$watchCollection("properties.start",function(){c.draw()}),a.$watchCollection("properties.scale",function(){c.draw()}),a.$watch("corners",function(){c.draw()},!0)},f=function(a,b){return function(){c||e();var d=document.getElementById(a),f=new FileReader;f.onloadend=function(a){b(a.target.result)},d.onchange=function(a){f.readAsDataURL(a.target.files[0])},d.click()}};a.loadBG=f("background-file",function(a){var b=new Image;b.src=a,b.onload=function(){c.setBackground(b)}}),a.importFile=f("import-file",function(b){var c=atob(b.split("base64,")[1]),d=luaparse.parse(c);d.body.forEach(function(b){if("Track"==b.variables[0].name){var c={STRAIGHT:0,LEFT:1,RIGHT:-1},d={layout:[],layoutInfo:[],cornerRadius:[],slope:[],sportiness:[],camber:[]},e=[];b.init[0].fields.forEach(function(a){switch(a.key.name){case"Name":d.name=a.value.value;break;case"Split1":d.split1=a.value.value;break;case"Split2":d.split2=a.value.value;break;case"Start":d.start={x:a.value.fields[0].value.value,y:a.value.fields[1].value.value};break;case"Scale":if("/"!=a.value.operator)throw Error("Scale must be a pixels/length division");d.scale={pixels:a.value.left.value,meters:a.value.right.value};break;case"Layout":a.value.fields.forEach(function(a){"Identifier"==a.value.type?d.layout.push(c[a.value.name]):"NumericLiteral"==a.value.type&&d.layout.push(a.value.value)});break;case"LayoutInfo":a.value.fields.forEach(function(a){d.layoutInfo.push(a.value.value)});break;case"CornerRadius":a.value.fields.forEach(function(a){d.cornerRadius.push(a.value.value)});break;case"Slope":a.value.fields.forEach(function(a){d.slope.push("-"==a.value.operator?-a.value.argument.value:a.value.value)});break;case"Sportiness":a.value.fields.forEach(function(a){d.sportiness.push(a.value.value)});break;case"Camber":a.value.fields.forEach(function(a){d.camber.push("-"==a.value.operator?-a.value.argument.value:a.value.value)})}});for(var f=0;f<d.layout.length;f++)e.push({layout:d.layout[f],layoutInfo:d.layoutInfo[f],radius:d.cornerRadius[f],slope:d.slope[f],sportiness:d.sportiness[f],camber:d.camber[f]});delete d.layout,delete d.layoutInfo,delete d.cornerRadius,delete d.slope,delete d.sportiness,delete d.camber,Object.keys(d).forEach(function(b){a.properties[b]=d[b]}),a.corners=e,a.selected=e.length-1,a.$apply()}})}),a.exportFile=function(){d||(d=angular.element("#track-template").text(),Mustache.parse(d));var b=angular.copy(a.properties);b.layout=[],b.layoutInfo=[],b.cornerRadius=[],b.slope=[],b.sportiness=[],b.camber=[],a.corners.forEach(function(a){switch(a.layout){case 0:b.layout.push("STRAIGHT");break;case 1:b.layout.push("LEFT");break;case-1:b.layout.push("RIGHT")}b.layoutInfo.push(a.layoutInfo),b.cornerRadius.push(a.radius),b.slope.push(a.slope),b.sportiness.push(a.sportiness),b.camber.push(a.camber)});var c=Mustache.render(d,b);window.open("data:text/x-lua;base64,"+btoa(c),"_blank")},a.cornerPush=function(){var b=angular.copy(a.defaultCorner),c=a.corners.push(b);a.selected=c-1},a.cornerPop=function(){a.corners.pop(),a.selected=Math.min(a.selected,a.corners.length-1)},a.cornerStraight=function(){a.corners[a.selected].layout!=STRAIGHT&&(a.corners[a.selected].layoutInfo=a.corners[a.selected].radius,a.corners[a.selected].radius=0),a.corners[a.selected].layout=STRAIGHT},a.cornerLeft=function(){a.corners[a.selected].layout==STRAIGHT&&(a.corners[a.selected].radius=a.corners[a.selected].layoutInfo,a.corners[a.selected].layoutInfo=90),a.corners[a.selected].layout=LEFT},a.cornerRight=function(){a.corners[a.selected].layout==STRAIGHT&&(a.corners[a.selected].radius=a.corners[a.selected].layoutInfo,a.corners[a.selected].layoutInfo=90),a.corners[a.selected].layout=RIGHT}}]);