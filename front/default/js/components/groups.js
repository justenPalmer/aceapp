/*
------
GROUPS
------
Primary data management of the jin system
*/
jin.groups = {
	/*
	init (fun): initialize all groups
	*/
	init:function(){
		//init all groups
		for (i in jin.g) {
			if (jin.g[i].init) {
				jin.g[i].init();
			}
		}
	},

	/*
	setupGroup (fun): sets up the group data for an action
		group (str or obj)
			path (str): defines parameteres of group in a single string - unique to each group
			g (str): group pattern - required for each group
		---cb---
		success (fun)
		fail (fun)
	*/
	setupGroup:function(a,cb){
		var me = this;
		me.setupPath(a);
		me.setupRef(a);
		me.setupJin(a);
		cb.success(a);
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
		if (!a.group.path) a.group.path = jin.tools.morph({target:a.group,clone:true,sort:true,shrink:'_jin',freeze:true});
	},

	/*
	setupRef (fun): sets up the global reference to the group
		group (obj)
	*/
	setupRef:function(a){
		var me = this;
		if (!a.group.g) return;
		if (!me.refs) me.refs = {};
		if (!me.refs[a.group.g]) me.refs[a.group.g] = {paths:{}};
		if (!me.refs[a.group.g].paths[a.group.path]) this.refs[a.group.g].paths[a.group.path] = a.group;
		a.group = me.refs[a.group.g].paths[a.group.path];
	},
	/*
	setupJin (fun): sets up the _jin property
		group (obj)
	*/
	setupJin:function(a,cb){
		if (!a.group._jin) a.group._jin = {recs:[],cb:{}};
	},

	/*
	action (fun): performs a group action
		group (obj)
		action (str): method of group to call
		[send] (bool): sends action to server by default if true
		---cb---
		success (fun)
		fail (fun)
	*/
	action:function(a,cb){
		var me = this;
		cb = cb || {};
		if (!cb.success) cb.success = function(res){/*console.log('action success:', a, res)*/};
		if (!cb.fail) cb.fail = function(res){console.log('action err:', a, res);};
		me.setupGroup(a,{
			success:function(a){
				if (a.send || !me.actionMethod(a,cb)) { //if method exists do not call api directly
					me.actionSend(a,cb); //send api call to server
				}
			},
			fail:function(res){cb.fail(res);}
		});
	},
	
	/*
	actionMethod (fun): calls a method of a group or a default action
		group
		action
	*/
	actionMethod:function(a,cb){
		var key = 'action'+jin.tools.format({target:a.action,upper:'first'});
		if (jin.g[a.group.g] && jin.g[a.group.g][key]) { //action defined at g pattern level
			jin.g[a.group.g][key](a,cb);
			return true;
		}
		if (jin.groups[key]) { //action defined at groups (this) level
			jin.groups[key](a,cb);
			return true;
		}
		return false;
	},
	
	/*
	actionSend (fun): sends an action to the back end
		group
		action
	*/
	actionSend:function(a,cb){
		//send group in path format
		//var send = jin.tools.morph({target:a,freeze:true});

		//console.log('action send:',a);
		var send = a;
		send.group = a.group.path;
		//console.log('send:',a);

		jin.api.send({
			api:'group',
			send:send,
			post:a.post,
			get:a.get,
			go:a.go
		},{
			success:function(res){
				return cb.success(res);
			},
			fail:function(res){
				return cb.fail(res);
			}
		});
	},
	
	/*
	actionBind (fun): binds callbacks to a group
		group (obj)
		key (str): identifier for bound callbacks
		---cb---
		(any) callbacks to bind to group
	*/
	actionBind:function(a,cb){
		if (!a.key) return cb.fail('group bind err: no key defined');
		
		for (var i in cb) {
			if (i != 'success' && i != 'fail') {
				//console.log('event bound group',a.group,a.key);
				if (!a.group._jin.cb[i]) a.group._jin.cb[i] = {};
				a.group._jin.cb[i][a.key] = cb[i];
			}
		}
		return cb.success('group action bound');
	},
	/*
	actionUnbind (fun): unbind all callbacks from a key
		group (obj)
		key (str): identifier for bound callbacks
	*/
	actionUnbind:function(a,cb){
		if (a.key) { //key defined, unbind key refs
			for (var i in a.group._jin.cb) {
				//console.log('group unbind:',i,a.key,a.group._jin.cb[i][a.key]);
				if (a.group._jin.cb[i][a.key]) delete a.group._jin.cb[i][a.key];
				//console.log('group unbind 2:',i,a.key,a.group._jin.cb[i][a.key]);
			}
			return cb.success('group actions unbound');
		}
	},
	/*
	actionTrigger (fun): triggers callbacks on a group
		group
		event
	*/
	actionTrigger:function(a,cb){
		//console.log('triggered',a);
		if (a.group._jin.cb && a.group._jin.cb[a.event]) {
			for (var key in a.group._jin.cb[a.event]) {
				a.group._jin.cb[a.event][key](a);
			}
			return cb.success('group callback triggered');
		}
	},
	
	/*
	actionGetRecs (fun)
		path
		group
			[id]
		key
		[reset] (bool): if true, remove recs before retrieving new ones
	*/
	actionGetRecs:function(a,cb){
		var me = this;

		//console.log('get recs');
		if (!a.key) return cb.fail('group get rec err: no key defined');

		if (a.reset) { //reset the recs
			//console.log('reset recs:',a.group);
			a.group._jin.recsLoadComplete = false;
			a.group._jin.getRecsLoading = false;
			a.group._jin.recs = []; //destroy previous recs
		}

		//console.log('get recs:',a);

		if (a.group._jin.recsLoadComplete) { //recs are already loaded
			return cb.success(a.group._jin.recs);
		}

		//if there is a group id
		if (a.group.id) {
			//console.log('get rec id success:',a.group._jin.recs[0]);
			if (a.group._jin.recs && a.group._jin.recs.length > 0) {
				a.group._jin.recsLoadComplete = true;
				a.group._jin.getRecsLoading = false;
				return cb.success(a.group._jin.recs);
			}
			//get one record that is targetted (if it exists)
			//console.log('group refs:',me.refs[a.group.g]);
			if (me.refs[a.group.g] && me.refs[a.group.g].recs && me.refs[a.group.g].recs[a.group.id]) {
				a.group._jin.recsLoadComplete = true;
				a.group._jin.getRecsLoading = false;

				//console.log('get rec:',a);
				jin.groups.action({
					group:a.group,
					action:'addRec',
					noTrigger:true,
					rec:me.refs[a.group.g].recs[a.group.id]
				});
				
				//console.log('groups rec id found');
				return cb.success([me.refs[a.group.g].recs[a.group.id]]);
			}
		}

		if (a.group._jin.getRecsLoading) {
			//console.log('recs loading:',a.group);
			return me.action({
				action:'bind',
				key:a.key,
				group:a.group
			},{
				loaded:function(res){
					//console.log('rec loaded:',res,' for group:',a.group);
					cb.success(res.recs);
				}
			});
		}

		if (!a.group._jin.getRecsLoading) {
			//console.log('get recs');
			a.group._jin.getRecsLoading = true;
			//console.log('load rec:',a.group);
			jin.groups.action({
				action:'getRecs',
				send:true,
				group:a.group
			},{
				success:function(res){
					var recs = res.recs;

					a.group._jin.recsLoadComplete = true;
					a.group._jin.getRecsLoading = false;

					//console.log('recs found:',recs);

					if (!recs) return cb.success([]);
					for (var i=0,len=recs.length;i<len;i++){
						jin.groups.action({
							group:a.group,
							action:'addRec',
							noTrigger:true,
							rec:recs[i]
						});
					}
					
					//call loaded
					jin.groups.action({
						action:'trigger',
						group:a.group,
						event:'loaded',
						recs:a.group._jin.recs
					});
					
					return cb.success(a.group._jin.recs);
				},
				fail:function(res){
					//console.log('get recs fail:',res);
					a.group._jin.recsLoadComplete = true;
					a.group._jin.getRecsLoading = false;

					return cb.fail(res);
				}
			});
		}
		
		//console.log('rec not found:',a);
	},
	
	/*
	actionAddRec (fun)
		group
		noTrigger (boolean): true if add event is not to be triggered
		rec
			id
	*/
	refs:{},
	actionAddRec:function(a,cb){
		var me = this;
		//console.log('add rec a:',a);
		if (!a.rec) return cb.fail('add rec: no rec defined');
		if (!a.rec.id && a.group.id) a.rec.id = a.group.id;
		if (!a.rec.id) return cb.fail('add res: no rec id defined');
		var rec = a.rec;
		if (!me.refs[a.group.g]) me.refs[a.group.g] = {};
		if (!me.refs[a.group.g].recs) me.refs[a.group.g].recs = {}; 
		me.refs[a.group.g].recs[rec.id] = rec;
		
		if (a.group.id) a.group._jin.recs = [rec];
		else if (a.group._jin.recs.indexOf(me.refs[a.group.g].recs[rec.id]) === -1)
			a.group._jin.recs.push(me.refs[a.group.g].recs[rec.id]);

		if (!a.noTrigger) me.action({group:a.group,action:'trigger',event:'add',rec:rec});
		//console.log('rec added:',a.rec);
		cb.success(rec);
	},
	
	/*
	actionUpdateRec (fun)
		group
		noTrigger (boolean): true if add event is not to be triggered
		rec
			id
	*/
	actionUpdateRec:function(a,cb){
		var me = this;
		if (!a.rec) return cb.fail('update rec: no rec defined');
		if (!a.rec.id) return cb.fail('update rec: no rec id defined');
		var rec = a.rec;
		if (!me.refs[a.group.g].recs || !me.refs[a.group.g].recs[rec.id]) return cb.fail('update rec: no rec found');
		for (var i in rec){
			me.refs[a.group.g].recs[rec.id][i] = rec[i];
			a.group._jin.recs[0][i] = rec[i];
		}
		console.log('update rec:',rec.id,me.refs[a.group.g].recs[rec.id]);
		if (!a.noTrigger) me.action({group:a.group,action:'trigger',id:rec.id,event:'update',rec:rec});
		cb.success(rec);
	},
	
	/*
	actionRemoveRec (fun)
		group
		rec
			id
	*/
	actionRemoveRec:function(a,cb){
		var me = this;
		if (!a.rec) return cb.fail('remove rec: no rec defined');
		if (!a.rec.id) return cb.fail('remove rec: no rec id defined');
		if (!me.refs[a.group.g].recs[a.rec.id]) return cb.fail('remove rec: no rec found');
			
		if (a.group.id){ //group id defined, delete rec from all lists
			for (var i in me.refs[a.group.g].paths){
				//console.log('delete list attempt i:',i,me.refs[a.group.g].paths[i]);
				if (me.refs[a.group.g].paths[i]._jin.recs) {
					var ind = me.refs[a.group.g].paths[i]._jin.recs.indexOf(me.refs[a.group.g].recs[a.rec.id]);
					//console.log('delete list ind:',ind,a.group.g,i);
					if (ind != -1) me.refs[a.group.g].paths[i]._jin.recs.splice(ind,1);
					if (me.refs[a.group.g].paths[i]._jin.recs.length < 1) me.refs[a.group.g].paths[i]._jin.recsLoadComplete = false;
				}
			}
			delete me.refs[a.group.g].recs[a.rec.id];
		}
		else { //no group id, delete rec from only group list
			if (me.refs[a.group.g].paths[a.group.path]._jin.recs) {
				var ind = me.refs[a.group.g].paths[a.group.path]._jin.recs.indexOf(me.refs[a.group.g].recs[a.rec.id]);
				//console.log('delete list ind:',ind,a.group.g,i);
				if (ind != -1) me.refs[a.group.g].paths[a.group.path]._jin.recs.splice(ind,1);
				if (me.refs[a.group.g].paths[a.group.path]._jin.recs.length < 1) me.refs[a.group.g].paths[a.group.path]._jin.recsLoadComplete = false;
			}
		}

		if (!a.noTrigger) me.action({group:a.group,action:'trigger',event:'remove',rec:a.rec});
		cb.success(a.rec);
	}
	
};