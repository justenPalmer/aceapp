exports.e = chatAlerts = {
	init:function(jinR){jin = jinR;},
	col:'chatAlerts',
	fields:{
		userId:{id:true},
		count:{integer:true,min:1,max:2500}
	},
	actionAdd:function(a,cb){
		var me = this;
		if (!a.scope.session.user) return cb.fail('no session');

		jin.groups.action({
			scope:a.scope,
			action:'restrict',
			group:{g:'users'},
			allow:['admin','pioneer']
		},{
			success:function(){
				
				//add this alert to total for each user not this user id
				jin.groups.action({
					scope:a.scope,
					action:'getRecs',
					group:{g:'users',find:{}}
				},{
					success:function(res){
						var recs = res.recs;

						jin.tools.loop({
							ary:recs
						},{
							loop:function(loop){
								var user = recs[loop.i];
								if (user.id == a.scope.session.user.id) return loop.next();

								jin.query.action({
									action:'upsert',
									col:me.col,
									where:{userId:user.id},
									upsert:{$inc:{count:1}}
								},{
									success:function(rec){
										//broadcast out alert update
										jin.groups.sendBroadcast({
											group:{
												g:a.group.g,
												id:rec.id
											},
											action:'updateRec',
											rec:rec
										});

										loop.next();
									}
								});
							},
							success:function(){
								return cb.success();
							}
						});
						
					}
				});
			}
		});
	},

	/*
	actionGetUserAlert

	*/
	actionGetUserAlert:function(a,cb){
		//console.log('get user alert:',a);
		var me = this;
		if (!a.scope.session.user) return cb.fail('no session');

		jin.groups.action({
			scope:a.scope,
			action:'restrict',
			group:{g:'users'},
			allow:['admin','pioneer']
		},{
			success:function(){
				jin.query.action({
					action:'find',
					col:me.col,
					find:{userId:a.scope.session.user.id}
				},{
					success:function(recs){
						if (!recs || recs.length < 1){
							//add new rec
							jin.query.action({
								action:'upsert',
								col:me.col,
								where:{userId:a.scope.session.user.id},
								upsert:{$set:{count:0}}
							},{
								success:function(rec){
									cb.success({rec:rec});
								}
							});
							return;
						}
						cb.success({rec:recs[0]});
					}
				});

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
		if (!a.scope.session.user) return cb.fail('no session');

		if (a.group.id) a.group.find = {id:a.group.id};
		jin.query.action({
			action:'find',
			col:me.col,
			find:a.group.find,
			sort:{created:1},
			limit:500
		},{
			success:function(recs){
				//console.log('tune into bc:',a.group.path);
				jin.groups.joinBroadcast({
					scope:a.scope,
					group:{
						g:a.group.g,
						find:a.group.find
					}
				});

				//console.log('task get recs res:',recs);
				cb.success({recs:recs});
			}
		});
	},

	actionClearAlerts:function(a,cb){
		var me = this;
		if (!a.scope.session.user) return cb.fail('no session');

		jin.query.action({
			action:'upsert',
			col:me.col,
			where:{userId:a.scope.session.user.id},
			upsert:{$set:{count:0}}
		},{
			success:function(rec){

				jin.groups.sendBroadcast({
					group:{
						g:a.group.g,
						id:rec.id
					},
					action:'updateRec',
					rec:rec
				});
				
				cb.success({rec:rec});
			}
		});
	}
};