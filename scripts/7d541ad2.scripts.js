"use strict";var app=angular.module("automationTrackBuilderApp",[]);app.value("directions",{STRAIGHT:0,LEFT:1,RIGHT:-1}),angular.module("automationTrackBuilderApp").factory("trackOverview",["$timeout","directions","track",function(a,b,c){return function(d){var e=new fabric.Canvas(d,{containerClass:"center-block",selection:!1});e.setBackgroundColor("gray");var f={originX:"center",originY:"center",lockMovementX:!0,lockMovementY:!0,lockRotation:!0,lockScalingX:!0,lockScalingY:!0,hasControls:!1,fill:"transparent",stroke:"red",strokeWidth:5},g=new fabric.Circle({left:-10,top:-10,radius:5,fill:"red"}),h=[],i={radius:2.5,fill:"red",selectable:!1};return e.add(g),{draw:function(){var d=c.selected,j=0,k=new fabric.Point(c.start.x/2,c.start.y/2),l=c.scale.pixels/(2*c.scale.meters);g.setPositionByOrigin(k),e.clear(),h=[],c.corners.forEach(function(d,g){var m,n;if(d.layout==b.STRAIGHT){var o=d.layoutInfo*l*Math.cos(toRadians(j)),p=d.layoutInfo*l*Math.sin(toRadians(j));m=new fabric.Point(k.x+o,k.y+p),n=new fabric.Line([k.x,k.y,m.x,m.y],f)}else{var q=j;j=d.layout==b.LEFT?(j-d.layoutInfo/2)%360:(j+d.layoutInfo/2)%360;var r=2*d.radius*Math.sin(toRadians(d.layoutInfo/2)),o=r*l*Math.cos(toRadians(j)),p=r*l*Math.sin(toRadians(j));j=d.layout==b.LEFT?(j-d.layoutInfo/2)%360:(j+d.layoutInfo/2)%360,m=new fabric.Point(k.x+o,k.y+p);var s=2*d.radius*Math.sin(toRadians(d.layoutInfo/4)),t=q;d.layout==b.LEFT?t-=d.layoutInfo/4%360:t+=d.layoutInfo/4%360;var u=k.x+s*l*Math.cos(toRadians(t)),v=k.y+s*l*Math.sin(toRadians(t)),w=[["M",k.x,k.y],["Q",u,v,m.x,m.y]];n=new fabric.Path(w,f)}var x=new fabric.Circle(i);x.setPositionByOrigin(m),e.add(x),n.pos=g,n.on("selected",function(){var b=this;a(function(){c.selected=b.pos})}),h.push(n),k=m}),h.forEach(function(a){e.add(a)}),e.renderAll(),d>=0&&e.setActiveObject(h[d])},setBackground:function(a){var b=new fabric.Image(a,{width:e.width,height:e.height});e.setBackgroundImage(b,e.renderAll.bind(e))}}}}]),angular.module("automationTrackBuilderApp").service("track",["directions",function(a){var b={layout:0,layoutInfo:100,radius:0,slope:0,camber:0,sportiness:0};this.name="Track",this.start={x:640,y:360},this.split1=1,this.split2=2,this.scale={pixels:20,meters:10},this.corners=[b],this.selected=0,this.parse=function(b){var c=this,d=atob(b.split("base64,")[1]),e=luaparse.parse(d);e.body.forEach(function(b){if("Track"==b.variables[0].name){var d={layout:[],layoutInfo:[],cornerRadius:[],slope:[],sportiness:[],camber:[]};b.init[0].fields.forEach(function(b){switch(b.key.name){case"Name":d.name=b.value.value;break;case"Split1":d.split1=b.value.value;break;case"Split2":d.split2=b.value.value;break;case"Start":d.start={x:b.value.fields[0].value.value,y:b.value.fields[1].value.value};break;case"Scale":if("/"!=b.value.operator)throw Error("Scale must be a pixels/length division");d.scale={pixels:b.value.left.value,meters:b.value.right.value};break;case"Layout":b.value.fields.forEach(function(b){"Identifier"==b.value.type?d.layout.push(a[b.value.name]):"NumericLiteral"==b.value.type&&d.layout.push(b.value.value)});break;case"LayoutInfo":b.value.fields.forEach(function(a){d.layoutInfo.push(a.value.value)});break;case"CornerRadius":b.value.fields.forEach(function(a){d.cornerRadius.push(a.value.value)});break;case"Slope":b.value.fields.forEach(function(a){d.slope.push("-"==a.value.operator?-a.value.argument.value:a.value.value)});break;case"Sportiness":b.value.fields.forEach(function(a){d.sportiness.push(a.value.value)});break;case"Camber":b.value.fields.forEach(function(a){d.camber.push("-"==a.value.operator?-a.value.argument.value:a.value.value)})}}),c.corners.length=0;for(var e=0;e<d.layout.length;e++)c.corners.push({layout:d.layout[e],layoutInfo:d.layoutInfo[e],radius:d.cornerRadius[e],slope:d.slope[e],sportiness:d.sportiness[e],camber:d.camber[e]});c.name=d.name,c.split1=d.split1,c.split2=d.split2,c.start=d.start,c.scale=d.scale,c.selected=c.corners.length-1}})},this.cornerPush=function(){var a=angular.copy(b),c=this.corners.push(a);this.selected=c-1},this.cornerPop=function(){this.corners.pop(),this.selected=Math.min(this.selected,this.corners.length-1)},this.cornerStraight=function(){this.corners[this.selected].layout!=a.STRAIGHT&&(this.corners[this.selected].layoutInfo=this.corners[this.selected].radius,this.corners[this.selected].radius=0),this.corners[this.selected].layout=a.STRAIGHT},this.cornerLeft=function(){this.corners[this.selected].layout==a.STRAIGHT&&(this.corners[this.selected].radius=this.corners[this.selected].layoutInfo,this.corners[this.selected].layoutInfo=90),this.corners[this.selected].layout=a.LEFT},this.cornerRight=function(){this.corners[this.selected].layout==a.STRAIGHT&&(this.corners[this.selected].radius=this.corners[this.selected].layoutInfo,this.corners[this.selected].layoutInfo=90),this.corners[this.selected].layout=a.RIGHT}}]);var toRadians=function(a){return a/180*Math.PI};angular.module("automationTrackBuilderApp").controller("MainCtrl",["$scope","directions","track","trackOverview",function(a,b,c,d){var e;a.track=c,a.$on("$includeContentLoaded",function(){a.overview=d("track-overview"),a.onTrackUpdate(),e=angular.element("#track-template").text(),Mustache.parse(e)});var f=function(a,b){return function(){var c=document.getElementById(a),d=new FileReader;d.onloadend=function(a){b(a.target.result)},c.onchange=function(a){d.readAsDataURL(a.target.files[0])},c.click()}};a.loadBG=f("background-file",function(b){var c=new Image;c.src=b,c.onload=function(){a.overview.setBackground(c)}}),a.importFile=f("import-file",function(b){c.parse(b),a.onTrackUpdate()}),a.exportFile=function(){var a=angular.copy(c);a.layout=[],a.layoutInfo=[],a.cornerRadius=[],a.slope=[],a.sportiness=[],a.camber=[],c.corners.forEach(function(b){switch(b.layout){case 0:a.layout.push("STRAIGHT");break;case 1:a.layout.push("LEFT");break;case-1:a.layout.push("RIGHT")}a.layoutInfo.push(b.layoutInfo),a.cornerRadius.push(b.radius),a.slope.push(b.slope),a.sportiness.push(b.sportiness),a.camber.push(b.camber)});var b=Mustache.render(e,a);window.open("data:text/x-lua;base64,"+btoa(b),"_blank")},a.onTrackUpdate=function(){a.total2D=0,a.total3D=0,c.corners.forEach(function(c){c.length2D=c.layout==b.STRAIGHT?c.layoutInfo:c.radius*toRadians(c.layoutInfo);var d=Math.atan(c.slope/100);c.length3D=c.length2D/Math.cos(d),c.distance2D=a.total2D,c.distance3D=a.total3D,a.total2D+=c.length2D,a.total3D+=c.length3D}),a.overview.draw()}}]);