/*
---------
BROADCAST
---------
handles all live broadcasts
*/
var jin;
var broadcast = {
	refs:{},
	init:function(jinR){jin = jinR;},

	/*
	join (fun): joins a broadcast
		channel (str): channel to join
	*/
	join:function(a,cb){
		cb = cb || {};
		if (!cb.success) cb.success = function(){};
		if (!cb.fail) cb.fail = function(res){/*console.log('broadcast join err:',res)*/};

		var me = this;
		if (!a.scope.session) return cb.fail('no session for this user');
		if (!me.refs[a.channel]) me.refs[a.channel] = [];
		if (me.refs[a.channel].indexOf(a.scope.session.id) !== -1) return cb.fail('already tuned into this channel'); //already tuned into broadcast
		me.refs[a.channel].push(a.scope.session.id);
		if (!a.scope.broadcast) a.scope.broadcast = [];
		a.scope.broadcast.push(a.channel);
	},

	/*
	leave (fun): leaves broadcasts
		channel
	*/
	leave:function(a,cb){
		var me = this;
		cb = cb || {};
		if (!cb.success) cb.success = function(){};
		//console.log('leave broadcast:'+broadcast);
		if (!a.channel) { //leave all
			if (a.scope.broadcast) { //if broadcasts
				for (var i=0,len=a.scope.broadcast.length;i<len;i++) {
					me.leaveOneRef(a);
				}
				a.scope.broadcast = [];
				return cb.success(a);
			}		
		}
		//leave one
		me.leaveOneRef(a);
		me.leaveOneScope(a);
	},
	leaveOneRef:function(a) {
		var me = this;
		if (!me.refs[a.channel]) return;
		//var userId = jin.users.get(scope, '_id');
		var ind = me.refs[a.channel].indexOf(a.scope.session.id);
		if (ind != -1) { //index found
			me.refs[a.channel].splice(ind,1); //remove user from list
		}
	},
	leaveOneScope:function(a){
		if (!a.scope.broadcast) return;
		var ind = a.scope.broadcast.indexOf(a.channel);
		if (ind != -1) { //index found
			a.scope.broadcast.splice(ind,1); //remove user from list
		}
	},
	/*
	send (fun): sends a broadcast to a user
		channel
		send (obj): data to send
	*/
	send:function(a,cb){
		cb = cb || {};
		if (!cb.fail) cb.fail = function(err){console.log('send broadcast fail:',err)};
		if (!cb.success) cb.success = function(){};

		var me = this;
		if (!me.refs[a.channel]) return cb.fail('no one tuned into this channel');
		//console.log('send bc:',a.send);
		for (var i=0,len=me.refs[a.channel].length;i<len;i++) {
			a.event = 'broadcast';
			a.sessId = me.refs[a.channel][i];
			jin.socket.sendSession(a);
		}
		cb.success();
	}
};
exports.e = broadcast;