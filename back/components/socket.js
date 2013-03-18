/*
------
SOCKET
------
handles all socket connections
*/
var jin;
var socket = {
	init:function(jinR){jin = jinR;},

	/*
	startServer (fun): starts a new socket server
		[port] (number): port to listen to, defaults to 81
		---cb---
		success (fun)
	*/
	startServer:function(a,cb){
		var me = this;
		if (!a.port) a.port = 81;

		var io = require('socket.io').listen(a.port);
		
		io.configure( function(){
		   io.set('log level', 1); //minimal socket.io logging
		});

		io.sockets.on('connection', function(s){
			me.getScope(s,{
				success:function(a){
					me.start(a, {
						success:function(a){
							me.bind(a);
						},
						fail:function(e){
							console.log('start failed:',e);
						}
					});
				}
			});
		});
		cb.success();
	},

	/*
	getScope (fun): gets the scope object
		s (obj): socket instance for client
		---cb---
		success (fun)
	*/
	getScope:function(s,cb){
		var me = this;
		var a = {};
		a.scope = {
			socket:s
		}
		a.scope.client = {ip:me.getIp(a)};
		cb.success(a);
	},

	/*
	getIp (fun): gets an ip address from the socket's client
		socket (obj)
		---return---
		(str): ip address of client
	*/
	getIp:function(a){
		if (a.scope.socket.ip) return a.scope.socket.ip;
		if (a.scope.socket.handshake) return a.scope.socket.handshake.address.address;
	},

	/*
	start (fun): binds start handler onto a socket
		scope (obj)
		---cb---
		success (fun)
	*/
	start:function(a,cb){
		var me = this;
		a.scope.socket.on('start',function(req){
			if (jin.session) {
				a.sessId = (req)? req.sessId: false;
				if (!a.sessId) a.sessId = jin.tools.hash({random:true});
				return jin.session.start(a,{
					success:function(a){
						a.send = {sessId:a.sessId};
						a.event = 'startRes';
						//console.log('send:',a.scope.session);
						me.send(a);
						me.add(a);

						cb.success(a);
					},
					fail:function(a){

					}
				});
			}
			return cb.success(a);
		});

		
	},

	/*
	bind (fun): binds handlers to socket
		scope (obj)
		---cb---
	*/
	bind:function(a,cb){
		var me = this;

		//var a = jin.tools.morph({target:aScope,clone:true});
		a.scope.socket.on('api',function(req){			
			var apiKey = req.apiKey;

			//restore a

			//console.log('api run:',req);
			return jin.api.run(jin.tools.morph({target:a,clone:true,merge:req}),{
				success:function(res){
					if (!res) res = {};
					res.success = true;
					res.apiKey = apiKey;
					a.send = res;
					a.event = 'apiRes';
					//console.log('api success:',a.send);
					me.send(a);
				},
				fail:function(res){
					if (!res) res = {};
					if (typeof res == 'string') res = {error:res};
					res.success = false;
					res.apiKey = apiKey;
					a.send = res;
					a.event = 'apiRes';
					//console.log('api fail:',res);
					me.send(a);
				}
			});
		});

		a.scope.socket.on('disconnect', function(data, send) {
	   	me.remove(a);
			if (jin.broadcast) jin.broadcast.leave(a);
			if (send) send({success:true});
	  	});
	},

	/*
	send (fun): sends a socket event to the client
		scope (obj)
		event (str): name of the event to send to the client
		send (obj): data to send with
		---cb---
		success (fun)
	*/
	send:function(a,cb){
		if (!a.event) a.event = 'res';
		if (a.scope.socket) return a.scope.socket.emit(a.event, a.send);
		cb.success(a);
	},

	refs:{},
	add:function(a,cb){
		var me = this;
	
		//console.log('add socket:',a);
		if (!a.scope.socket) return cb.fail('no socket');

		if (!me.refs[a.scope.session.id]) me.refs[a.scope.session.id] = [];
		me.refs[a.scope.session.id].push(a.scope.socket);
	},
	
	/*
	remove (fun): removes a socket instance
		scope
			socket
	*/
	remove:function(a,cb) {
		var me = this;
		//var user = jin.session.data(scope, 'user');
		//if (!user) return;
		if (!a.scope.session.id) return cb.fail('no session id');
		if (!me.refs[a.scope.session.id]) return;
		var ind = me.refs[a.scope.session.id].indexOf(a.scope.socket);
		if (ind != -1) {
			me.refs[a.scope.session.id].splice(ind,1);
		}
	},

	/*
	sendSession (fun): sends an event to all in a session
		sessId (str): id of session to send this to
		event (str): socket event to send
		send (obj): data to send
	*/
	sendSession:function(a,cb){
		var me = this;
		cb = cb || {};
		//console.log('session socket:'+jin.session.data(scope, 'socket'));
		if (!cb.success) cb.success = function(){};
		if (!cb.fail) cb.fail = function(res){console.log('send session failed:',res)};

		//console.log('send session id:',a.send);

		if (!me.refs[a.sessId]) return cb.fail('no session sockets');
		for (var i=0,len=me.refs[a.sessId].length;i<len;i++) {
			if (me.refs[a.sessId][i]) me.refs[a.sessId][i].emit(a.event, a.send, function(){
				cb.success();
			});
		}
		return;
	}
};

exports.e = socket;