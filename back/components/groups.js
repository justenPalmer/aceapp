/*
------
GROUPS
------
handles all groups
*/
var fs = require('fs');
var jin;
var groups = {
	refs:{},
	init:function(jinR){
		jin = jinR;
		jin.tools.includeDir({
			root:jin.config.paths.root,
			dir:jin.config.paths.groups,
			namespace:'g'
		},{
			success:function(){
				//console.log('groups:',jin.g);
			}
		});
	},

	/*
	action (function): calls a method of a group
		scope (obj)
		group (obj or str): group data in object or string form
			g (str): group pattern
		action (str): action name to execute
		---cb---
		success (fun)
		fail (fun)
	*/
	action:function(a,cb){
		cb = cb || {};

		//console.log('action called:',a);
		if (!cb.success) cb.success = function(){};
		if (!cb.fail) cb.fail = function(res){console.log('group action err:',res)};
		if (!a || !a.action) return cb.fail('action not defined');
		if (!a.group) return cb.fail('group not defined');
		
		this.setupGroup(a, {
			success:function(a){
				var key = 'action'+jin.tools.format({target:a.action,upper:'first'});
				if (jin.g[a.group.g] && jin.g[a.group.g][key]) {
					return jin.g[a.group.g][key](a,cb);
				}
				return cb.fail('group action not found');
			}
		});
	},

	/*
	setupGroup (fun): if group is a string setupGroup expands it into an object
		group (obj or str)
	*/
	setupGroup:function(a,cb){
		var me = this;
		me.setupPath(a);
		return cb.success(a);
	},

	/*
	setupPath (fun): setup group path if it is not already defined
		group (obj)
	*/
	setupPath:function(a){
		if (typeof a.group == 'string') {
			//console.log('a.group str:',a.group);
			a.group = jin.tools.morph({thaw:a.group,merge:{path:a.group}});
		}
		if (a.group.path && !a.group.g) a.group = jin.tools.morph({thaw:a.group.path,merge:{path:a.group.path}});
		if (!a.group.path) a.group.path = jin.tools.morph({target:a.group,clone:true,shrink:'_jin',sort:true,freeze:true});
	},

	/*
	sendBroadcast (fun): sends a broadcast to those tuned into the group
		group (obj)
		action (str)
		data (any): any other data to send
	*/
	sendBroadcast:function(a,cb){
		this.setupGroup(a, {
			success:function(a){
				//console.log('send:',a.group);
				var send = jin.tools.morph({target:a,shrink:['scope','group'],clone:true});
				send.group = {path:a.group.path};
				console.log('send:',send.group.path);
				if (!a.group.id)
				return jin.broadcast.send({
					channel:a.group.path,
					send:send
				});
				jin.broadcast.send({
					channel:a.group.g,
					send:send
				});
			}
		});
	},

	/*
	joinBroadcast (fun): joins a broadcast (from group path)
		scope (obj)
		group (obj)
	*/
	joinBroadcast:function(a,cb){
		this.setupGroup(a, {
			success:function(a){
				console.log('join:',a.group.path);
				jin.broadcast.join({
					scope:a.scope,
					channel:a.group.path
				});
				jin.broadcast.join({
					scope:a.scope,
					channel:a.group.g
				});
			}
		});
	}
};
exports.e = groups;