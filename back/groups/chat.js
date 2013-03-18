/*
-------
g:USERS
-------
this is a generic users group
*/
var jin;
var chat = {
	refs:{},
	init:function(jinR){jin = jinR;},
	col:'chat',
	fields:{
		message:{min:1,max:2500}
	},

	/*
	actionUpsert (fun): standard upsert rec method
		group (obj)
	*/
	actionUpsert:function(a,cb){
		var me = this;
		jin.groups.action({
			scope:a.scope,
			action:'restrict',
			group:{g:'users'},
			allow:['admin','pioneer']
		},{
			success:function(){
				jin.tools.validate({
					input:a,
					rules:me.fields
				},{
					success:function(vals){
						if (!vals) return cb.fail('no values');
						if (!vals.message) return cb.fail('no message');

						vals.userId = vals.userId || a.scope.session.user.id;
						var where = a.group.id? {id:a.group.id}: {id:0};

						jin.query.action({
							action:'upsert',
							col:me.col,
							upsert:{$set:vals},
							where:where
						},{
							success:function(rec){

								if (where.id == 0) {
									/*
									console.log('send broadcast:',{
											g:a.group.g,
											find:{week:rec.week,userId:rec.userId}
										});
*/
									jin.groups.sendBroadcast({
										group:{
											g:a.group.g
										},
										action:'addRec',
										rec:rec
									});
								}
								else {
									jin.groups.sendBroadcast({
										group:{
											g:a.group.g,
											id:rec.id
										},
										action:'updateRec',
										rec:rec
									});
								}

								cb.success({rec:rec});
							},
							fail:function(res){
								cb.fail('query failed:',res);
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
	actionGetRecs (fun): standard retrieve recs method
		group (obj)
			find 
			id
			sort
			limit
	*/
	actionGetRecs:function(a,cb){
		var me = this;
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

	/*
	actionRemove (fun)
		group (obj)
			id
	*/
	actionRemove:function(a,cb){
		var me = this;

		jin.groups.action({
			scope:a.scope,
			action:'restrict',
			group:{g:'users'},
			allow:['admin','superAdmin','pioneer']
		},{
			success:function(){
				if (!a.group.id) return cb.fail('no id');

				jin.query.action({
					action:'find',
					col:me.col,
					find:{id:a.group.id}
				},{
					success:function(recs){
						var task = recs[0];
						jin.query.action({
							action:'remove',
							col:me.col,
							where:{id:a.group.id}
						},{
							success:function(rec){

								jin.groups.sendBroadcast({
									group:{
										g:a.group.g,
										id:a.group.id
									},
									action:'removeRec',
									rec:{id:a.group.id}
								});

								cb.success({});
							}
						});
					}
				});
			},
			fail:function(){
				cb.fail('not allowed');
			}
		});
	}
};
exports.e = chat;