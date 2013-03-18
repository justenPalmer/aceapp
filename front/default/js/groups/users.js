/*
-------
g:USERS
-------
handles all user aspects including logging in/out
*/
jin.g.users = {

	/*
	actionAuth (fun): authorizes user with a token stored in cookie
		---cb---
		success (fun): auth successful
		fail (fun): error in auth
	*/	
	actionAuth:function(a,cb){
		a.send = true;
		a.token = jin.cookies.get({name:'token'});

		if (!a.token) return cb.fail('token not stored');

		a.agency = jin.cookies.get({
			name:'agency'
		});

		console.log('auth send:',a);

		jin.groups.action(a,{
			success:function(res){
				console.log('users auth success',res);

				var user = res.user;
				
				//set session user id
				jin.session.set({
					userId:user.id,
					access:user.access
				});
				
				//add rec to users group
				jin.groups.action({
					action:'addRec',
					group:{g:'users'},
					rec:user
				},{
					success:function(){
						cb.success(res);
					}
				});

				//start online ping
				var onlinePing = function(){
					jin.ga({
						action:'online',
						group:{
							g:'users',
							id:user.id
						}
					},{
						success:function(){
							console.log('online success');
							setTimeout(function(){
								onlinePing();
							},10000);
						},
						fail:function(){
							console.log('online failed');
							setTimeout(function(){
								onlinePing();
							},10000);
						}
					});
				}
				
			},
			fail:function(res){
				console.log('users auth fail:',res);
				cb.fail(res);
			}
		});
	},

	/*
	actionLogin (fun): login user with email and password
		email (str)
		password (str)
		---cb---
		success (fun): login successful
		fail (fun): login failed
	*/
	actionLogin:function(a,cb){
		a.send = true;
		jin.groups.action(a,{
			action:'send',
			success:function(res){
				var user = res.user;

				//if token defined, store it
				if (res.token) jin.cookies.set({
					name:'token',
					value:res.token,
					path:'/',
					expires:5000
				});

				//store session userId
				jin.session.set({
					userId:user.id,
					access:user.access
				});

				//add user record to group
				jin.groups.action({
					action:'addRec',
					group:{g:'users'},
					rec:user
				},{
					success:function(){
						cb.success(res);
					}
				});
			},
			fail:function(res){
				cb.fail(res);
			}
		});
	},

	/*
	actionSignUp (fun): sign up user
		email (str)
		password (str)
		---cb---
		success (fun)
		fail (fun)
	*/
	/*
	actionSignUp:function(a,cb){
		a.send = true;

		jin.groups.action(a,{
			success:function(res){
				var user = res.user;
				
				//store token
				if (res.token) jin.cookies.set({
					name:'token', 
					value:res.token, 
					path:'/', 
					expires:5000
				});

				//store session userId
				jin.session.set({
					userId:user.id
				});

				//add user record to group
				jin.groups.action({
					action:'addRec',
					group:{g:'users'},
					rec:user
				},{
					success:function(){
						cb.success(res);
					}
				});
			},
			fail:function(res){
				cb.fail(res);
			}
		});
	},
	*/

	/*
	actionLogout (fun): logout user
		---cb---
		success (fun)
	*/
	actionLogout:function(a,cb){
		a.send = true;
		jin.groups.action(a,{
			success:function(res){
				console.log('logout success');
				
				//clear cookie
				jin.cookies.set({
					name:'token', 
					value:null, 
					path:'/'
				});

				//clear session
				jin.session.clear();

				//remove user rec from group
				jin.groups.action({
					action:'removeRec',
					group:{g:'users'},
					rec:res
				},{
					success:function(){
						cb.success(res);
					}
				});
			},
			fail:function(res){
				console.log('logout fail:',res);
				cb.fail(res);
			}
		});
	},

	/*
	actionRestrict (fun): allows access or denies it based on user access level
		allow (ary): list of access levels to allow
		group
			id
		---cb---
		success (fun)
		fail (fun)
	*/
	actionRestrict:function(a,cb){
		//attempt auth with token
		//console.log('restrict action:',a);
		var me = this;
		var access = jin.session.get('access');
		//console.log('user restrict:',access);

		//check each access in array
		if (a.allow) {
			for (var i=0,len=access.length;i<len;i++) {
				if (a.allow.indexOf(access[i]) !== -1) { //access is allowed
					return cb.success();
				}
			}
		}
		if (a.allow.indexOf('self') !== -1 && a.group.id){ //self allow
			var userId = jin.session.get('userId');
			if (userId == a.group.id) {
				return cb.success();
			}
		}
		return cb.fail();
	},

	getName:function(user){
		var name = '';
		if (user.fName) name += user.fName;
		if (user.lName) name += ' '+user.lName;
		if (name.length < 1) name = user.username;
		return name;
	}
};