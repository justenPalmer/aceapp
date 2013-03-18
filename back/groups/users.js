/*
-------
g:USERS
-------
this is a generic users group
*/
var jin;
var users = {
	refs:{},
	init:function(jinR){jin = jinR;},
	col:'users',
	fields:{
		username:{min:1,max:50},
		password:{min:4,max:50},
		token:{},
		fName:{min:1,max:100},
		lName:{min:1,max:100},
		email:{email:true},
		phone:{phone:'usa'},
		welcomeTeam:{}
	},
	access:['admin','pioneer','guest'],

	/*
	actionGetName (fun):
		group
	*/
	actionGetName:function(a,cb){
		var me = this;

		jin.query.action({
			col:me.col,
			action:'find',
			find:{
				id:a.group.id
			}
		},{
			success:function(recs){
				if (!recs || !recs[0]) return cb.success({name:'[user removed]'});
				var user = recs[0];
				if (user.fName && user.lName) return cb.success({name:user.fName+' '+user.lName});
				if (user.fName) return cb.success({name:user.fName});
				if (user.lName) return cb.success({name:user.lName});
				if (user.username) return cb.success({name:user.username});
			}
		});
	},

	/*
	actionAuth (fun): 
		token (str)
		agency (str)
	*/
	actionAuth:function(a,cb){
		var me = this;
		jin.tools.validate({
			rules:me.fields,
			input:a
		},{
			success:function(vals){

				//vals only has values that passed a validation test
				jin.query.action({
					col:me.col,
					action:'find',
					find:{
						token:vals.token
					}
				},{
					success:function(res){
						if (res) { //user found

							var user = res[0];
							a.scope.session.user = user

							jin.groups.joinBroadcast({
								scope:a.scope,
								group:{
									g:'users',
									id:user.id
								}
							});

							jin.groups.action({
								scope:a.scope,
								action:'online',
								group:{
									g:'users',
									id:user.id
								}
							});

							//jin.groups.joinBroadcast(scope, {group:a.group, id:user._id});
							cb.success({user:me.filter(user)});
						}
						else { //no user found
							cb.fail('user not found');
						}
					}
				});
			},
			fail:function(err){
				cb.fail(err);
			}
		});
	},

	actionOnline:function(a,cb){
		//set lastOnline to current ts
		var me = this;

		var updateOnline = function(){
			var D = new Date();
			var curTs = D.getTime();
			var vals = {
				lastOnline:curTs
			}

			jin.query.action({
				action:'update',
				col:me.col,
				update:{
					$set:vals
				},
				where:{id:a.group.id}
			},{
				success:function(rec){
					rec.online = true;
					jin.groups.sendBroadcast({
						group:{
							g:'users',
							id:rec.id
						},
						action:'updateRec',
						rec:me.filter(rec)
					});
				}
			});
		};

		var checkOnline = function(){
			jin.query.action({
				action:'find',
				col:me.col,
				find:{
					id:a.group.id
				}
			},{
				success:function(recs){
					if (!recs || !recs.length < 1) recs[0] = {lastOnline:0};
					var rec = recs[0];

					var D = new Date();
					var curTs = D.getTime();

					if (curTs-20000 > rec.lastOnline){
						rec.online = false;
						//set user to offline
						jin.groups.sendBroadcast({
							group:{
								g:'users',
								id:rec.id
							},
							action:'updateRec',
							rec:rec
						});
						return;
					}
					setTimeout(function(){
						checkOnline();
					},10000);
				}
			});
		};
		updateOnline();
		checkOnline();
	},

	/*
	login (fun): login
		email (str)
		password (str)
	*/
	actionLogin:function(a,cb){
		var me = this;
		jin.tools.validate({
			rules:me.fields,
			input:a
		},{
			success:function(vals){
				if (!vals.username) return cb.fail('no username entered');
				if (!vals.password) return cb.fail('no password entered');

				console.log('login vals:',vals);

				jin.query.action({
					col:me.col,
					action:'find',
					find:{
						username:vals.username
					}
				},{
					success:function(res){
						if (!res) return cb.fail('username and password don\'t match');

						console.log('user:',user);
						var user = res[0];
						var hash = jin.tools.hash({value:vals.password,salt:user.salt});

						console.log('hash:',hash,' password:',user.password);

						if (hash !== user.password) { //password not correct
							return cb.fail('username and password don\'t match');
						}

						jin.groups.action({
							scope:a.scope,
							action:'online',
							group:{
								g:'users',
								id:user.id
							}
						});

						a.scope.session.user = user;

						jin.groups.joinBroadcast({
							scope:a.scope,
							group:{
								g:'users',
								id:user.id
							}
						});
						
						if (user.token){
							return cb.success({user:me.filter(user), token:user.token});
						}
						user.token = jin.tools.hash({random:true});
						jin.query.action({
							action:'update',
							col:me.col,
							db:a.scope.session.agency,
							where:{id:user.id},
							update:{$set:{token:user.token}}
						},{
							success:function(user){
								return cb.success({user:me.filter(user), token:user.token});
							}
						});
					}
				});
			},
			fail:function(err){
				cb.fail(err);
			}
		});
	},

	/*
	actionLogout (fun): logout
	*/
	actionLogout:function(a,cb){
		//console.log('session:', a.scope.session);
		var user = a.scope.session.user;
		if (!user || !user.id) return cb.fail('no user');
		delete a.scope.session.user;
		cb.success({id:user.id});
	},

	/*
	actionSignUp (fun): sign up
		email (str)
		password (str)
	*/
	actionSignUp:function(a,cb){
		var me = this;
		jin.tools.validate({
			rules:me.fields,
			input:a
		},{
			success:function(vals){
				if (!vals.username) return cb.fail('enter a username');
				if (!vals.password) return cb.fail('enter a password');

				jin.query.action({
					col:me.col,
					action:'find',
					find:{
						username:vals.username
					}
				},{
					success:function(res){
						if (res) return cb.fail('username already signed up');
						var token = jin.tools.hash({random:true});
						var salt = jin.tools.hash({random:true});
						var password = jin.tools.hash({value:vals.password,salt:salt});

						jin.query.action({
							col:me.col,
							action:'insert',
							insert:{
								username:vals.username,
								password:password,
								salt:salt,
								access:['admin'],
								token:token
							}
						},{
							success:function(user){
								a.scope.session.user = user;
								cb.success({user:me.filter(user),token:token});
							}
						})
					}
				});
			},
			fail:function(err){
				cb.fail(err);
			}
		});
	},

	
	/*
	actionGetRecs (fun): standard retrieve recs method
		group (obj)
			find 
			id
			sort
			limit
	*/
	actionGetRecs:function(a,cb){
		var me = this;
		var qry = {
			action:'find',
			col:me.col,
			db:a.scope.session.agency
		};
		if (a.group.find) qry.find = a.group.find;
		if (a.group.id !== undefined) qry.find = {id:a.group.id};
		if (a.group.sort) qry.sort = a.group.sort;

		if (a.group.id) a.group.find = {id:a.group.id};
		jin.query.action(qry,{
			success:function(recs){
				for (var i=0,len=recs.length;i<len;i++){
					recs[i] = me.filter(recs[i]);
				}

				jin.groups.joinBroadcast({
					scope:a.scope,
					group:{
						path:a.group.path
					}
				});

				//console.log('user get recs res:',res);
				cb.success({recs:recs});
			}
		});
	},


	/*
	actionRestrict (fun): allows access or denies it based on user access level
		allow (ary): list of access levels to allow
		---cb---
		success (fun)
		fail (fun)
	*/
	actionRestrict:function(a,cb){
		//attempt auth with token
		//console.log('restrict action:',a);
		var me = this;
		var access = me.access(a);
		console.log('user restrict:',access);

		//check each access in array
		if (a.allow) {
			for (var i=0,len=access.length;i<len;i++) {
				if (a.allow.indexOf(access[i]) !== -1) { //access is allowed
					return cb.success();
				} 
			}
		}
		return cb.fail();
	},

	/*
	actionReqRestrict (fun): allows access or denies a request based on user level
		allow (ary): list of access levels to allow
		---cb---
		success (fun)
		fail (fun)
	*/
	actionReqRestrict:function(a,cb){
		//attempt auth with token
		var me = this;

		me.actionAuth(jin.tools.morph({
			target:a,
			merge:{token:a.scope.cookies.get('token')}
		}),{
			success:function(){
				me.actionRestrict(a,cb);
			},
			fail:function(){
				cb.fail();
			}
		});
	},

	/*
	actionRemove (fun): removes a user
	*/
	actionRemove:function(a,cb){
		jin.groups.action({
			scope:a.scope,
			action:'restrict',
			group:a.group,
			allow:['admin','superAdmin']
		},{
			success:function(){
				if (!a.group.id) return cb.fail('no id defined');

				jin.query.action({
					action:'remove',
					db:a.scope.session.agency,
					col:'users',
					where:{id:a.group.id}
				},{
					success:function(){
						jin.groups.sendBroadcast({
							group:{
								g:'users',
								id:a.group.id
							},
							action:'removeRec',
							rec:{id:a.group.id}
						});

						//jin.groups.sendBroadcast(scope, {group:{path:a.group.path}, action:'removeRes', data:{rec:{id:a.data}}});
						cb.success({rec:{id:a.group.id}});
					}
				});
			},
			fail:function(){
				cb.fail('not allowed');
			}
		});
	},

	actionUpdate:function(a,cb){
		var me = this;
		if (!a.group.id) return cb.fail('no id');

		jin.groups.action({
			action:'restrict',
			scope:a.scope,
			group:{g:'users'},
			allow:['admin','self']
		},{
			success:function(){
				jin.tools.validate({
					rules:me.fields,
					input:a
				},{
					success:function(vals){

						if (vals.password) {
							vals.salt = jin.tools.hash({random:true});
							vals.password = jin.tools.hash({value:vals.password,salt:vals.salt});
						}

						jin.query.action({
							action:'update',
							col:me.col,
							update:{
								$set:vals
							},
							where:{id:a.group.id}
						},{
							success:function(rec){
								jin.groups.sendBroadcast({
									group:{
										g:'users',
										id:rec.id
									},
									action:'updateRec',
									rec:me.filter(rec)
								});
							}
						});
					}
				});
			},
			fail:function(){
				cb.fail('not allowed');
			}
		});
	},

	actionUpsert:function(a,cb){
		//console.log('upsert a group:',a.group);
		var me = this;
		jin.groups.action({
			scope:a.scope,
			action:'restrict',
			group:{g:'users'},
			allow:['admin','superAdmin']
		},{
			success:function(){
				jin.tools.validate({
					input:a,
					rules:me.fields
				},{
					success:function(vals){
						console.log('upsert vals:',vals);
						if (vals.length < 1) return cb.fail('no values');

						if (!a.group.id) {
							a.group.id = 0;
							vals.access = [a.access];
							a.newRec = true;
						}

						if (vals.password) {
							vals.salt = jin.tools.hash({random:true});
							vals.password = jin.tools.hash({value:vals.password,salt:vals.salt});
						}
						
						var update = {
							$set:jin.tools.morph({target:vals, shrink:['id']})
						};

						jin.query.action({
							action:'upsert',
							db:a.scope.session.agency,
							col:me.col,
							where:{id:a.group.id},
							upsert:update
						}, {
							success:function(rec){
								rec = me.filter(rec);

								if (a.newRec) { //add
									jin.groups.sendBroadcast({
										group:{
											g:'users',
											find:{access:a.access}
										},
										action:'addRec',
										rec:me.filter(rec)
									});
								}
								else { //update
									jin.groups.sendBroadcast({
										group:{
											g:'users',
											id:rec.id
										},
										action:'updateRec',
										rec:me.filter(rec)
									});
								}
								
								cb.success({rec:me.filter(rec)});
							}
						});
					},
					fail:function(res){
						cb.fail(res);
					}
				});
			},
			fail:function(){
				cb.fail('not allowed');
			}
		});
	},


	/*
	filter (fun): filter user object for outgoing send
		user (object)
	*/
	filter:function(user){
		if (user.password) user.isPassword = 1;
		return jin.tools.morph({target:user,clone:true,shrink:['token','password','salt']});
	},
	access:function(a){
		//console.log('access:',a);
		if (!a.scope || !a.scope.session) return ['public'];
		var me = a.scope.session.user;
		if (!me) return ['public'];
		return me.access;
	}
};
exports.e = users;
