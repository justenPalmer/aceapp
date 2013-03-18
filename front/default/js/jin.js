/*
--------
JIN v1.0
--------
Core file for the front end jin framework
*/

//cross browser console.log support
if (!console) console = {};
if (!console.log) console.log = function(){};

var jin = {
	g:{}, //holds group patterns
	v:{}, //holds view patterns

	config:{
		log:true,
		views:{
			include:['views/compress.html'],
			'default':'home'
		}
	},

	/*
	go (function): goto path
		loc (str): path
	*/
	go:function(loc){
		loc = (loc.substr(0,2) != '#!')? '#!'+loc: loc;
		window.location = loc;
	},
	
	/*
	ga (function): group action shortcut
		a (json obj)
			group (json obj)
			action (str)
	*/
	ga:function(a, callbacks){
		jin.groups.action(a, callbacks);
	},

	/*
	va (function): view action shortcut
		a (json obj)
			view (json obj)
			action (str)
	*/
	va:function(a, callbacks){
		jin.views.action(a, callbacks);
	}
};

if (!jin.config.log) console.log = function(){};

$(function(){ //init
	//init all components
	for (i in jin) {
		if (jin[i].init) {
			jin[i].init();
		}
	}
});
