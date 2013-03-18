/*
-------
SESSION
-------
listens for and handles all user sessions
*/
var jin;
var session = {
	init:function(jinR){jin = jinR;},
	/*
	start (fun): starts a new session or revives an old session
		scope (obj)
		sessId (str): session id usually from cookie
		---cb---
		success (fun): adds session object to a.scope
	*/
	start:function(a,cb){
		//console.log('start session:',a.sessId);
		var me = this;
		if (!me.sessions) me.sessions = {};
		if (me.sessions[a.sessId]) { //session info alrdy exists
			a.scope.session = me.sessions[a.sessId];
			//console.log('session set started:',a.scope.session);
			return cb.success(a);
		}
		a.scope.session = {id:a.sessId}; //set session id
		//console.log('session set:',a.scope.session);
		me.sessions[a.sessId] = a.scope.session;
		
		cb.success(a);
	}
};
exports.e = session;