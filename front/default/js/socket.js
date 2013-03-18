/*
------
SOCKET
------
the main jin front end connection file
*/
var socket = {
	init:function(){
		var me = this;
		me.s = io.connect(socketPath);
		me.s.on('connect', function(){
			console.log('sess id:',socket.cookie.get({key:'jinSessId'}));
			var send = {sessId:socket.cookie.get({key:'jinSessId'})};
			me.s.emit('start', send); //send session to back end\
			me.s.on('startRes', function(res){

				console.log('startRes',res);
				if (!send.sessId) {
					socket.cookie.set({
						key:'jinSessId',
						value:res.sessId,
						path:'/'
					});
				}
				me.s.on('broadcast', function(res){
					socket.triggerBroadcast(res);
					//console.log('broadcast received:',res);
				});

				socket.triggerReady();
			});

			me.s.on('apiRes', function(res){
				if (me.cbs && me.cbs[res.apiKey]) {
					if (me.cbs[res.apiKey].success && res.success) me.cbs[res.apiKey].success(res);
					if (me.cbs[res.apiKey].fail && !res.success) me.cbs[res.apiKey].fail(res);
				}
			});
		});
	},
	/*
	api (fun): calls an api script
		api (str): name of api to call
		---cb---
		success (fun)
		fail (fun)
	*/
	api:function(a,cb){
		cb = cb || {};
		if (!cb.success) cb.success = function(){};
		if (!cb.fail) cb.fail = function(){};
		var me = this;

		if (!me.counter) me.counter = 0;
		me.counter++;
		a.apiKey = a.api+me.counter;
		me.s.emit('api', a);
		if (!me.cbs) me.cbs = {};
		me.cbs[a.apiKey] = cb;
	},
	/*
	ready (fun): overwrite to trigger things to happen on socket ready
	*/
	ready:function(cb){
		var me = this;
		if (me.isReady) return cb();
		me.readyCb = cb;
	},

	triggerReady:function(){
		var me = this;
		if (me.readyCb && !me.isReady) me.readyCb();
		me.isReady = true;
	},

	broadcast:function(cb){
		var me = this;
		me.bcCb = cb;
	},

	triggerBroadcast:function(res){
		var me = this;
		if (me.bcCb) me.bcCb(res);
	}
};

//connect to socket

//get cookie
socket.cookie = {
	/*
	setCookie (fun): stores a cookie on client
		key (str): name of cookie to be stored
		[value] (str): value to be stored in cookie, set value to null to destroy cookie
		[expires] (int): days from now that the cookie will expire in
		[path] (str): folders that cookie will be available to, use '/' for all folders
		[secure] (bool): for https cookies
	*/
	set:function(a){
		if (a.value === null) a.expires = -1; //destroy cookie
		if (typeof a.expires === 'number') {
			var days = a.expires, t = a.expires = new Date();
			t.setDate(t.getDate() + days);
      }
		a.value = String(a.value);
		return (document.cookie = [
			encodeURIComponent(a.key), '=',
			a.raw ? a.value : encodeURIComponent(a.value),
			a.expires ? '; expires=' + a.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
			a.path ? '; path=' + a.path : '',
			a.domain ? '; domain=' + a.domain : '',
			a.secure ? '; secure' : ''
      ].join(''));
	},
	/*
	get (fun): gets a cookie
		key (str): name of cookie to be stored
		[raw] (bool): if true, do not decode value
		---return--- 
		(str): value stored in cookie
	*/
	get:function(a) {
   	var result, decode = a.raw ? function (s){return s;}: decodeURIComponent;
   	return (result = new RegExp('(?:^|; )' + encodeURIComponent(a.key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
	}
};

var script = document.createElement("script");
script.src = socketPath+'/socket.io/socket.io.js';
script.type = 'text/javascript';
// most browsers
script.onload = function(){
	socket.init();
};
// IE 6 & 7
script.onreadystatechange = function() {
	if (this.readyState == 'complete') {
		socket.init();
	}
};
document.head.appendChild(script);
