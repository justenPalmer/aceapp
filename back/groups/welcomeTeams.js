/*
-------
g:CATEGORIES
-------
this is the categories group
*/
var jin;
var welcomeTeams = {
	refs:{},
	init:function(jinR){jin = jinR;},
	col:'welcomeTeams',
	fields:{
		facilitator:{id:true},
		users:{}
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

						var upsert = {};
						if (vals.users){
							if (vals.users.add){
								upsert.$push = {users:vals.users.add};
							}
							if (vals.users.remove){
								upsert.$pull = {users:vals.users.remove};
							}
						}

						vals.facilitator = upsert.$set = {facilitator:vals.facilitator};
						var where = a.group.id? {id:a.group.id}: {id:0};

						jin.query.action({
							action:'upsert',
							col:me.col,
							upsert:upsert,
							where:where
						},{
							success:function(rec){

								if (where.id == 0) {
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
		a.group.sort = (a.group.sort)? a.group.sort: {created:1};
		jin.query.action({
			action:'find',
			col:me.col,
			find:a.group.find,
			sort:a.group.sort,
			limit:500
		},{
			success:function(recs){
				jin.groups.joinBroadcast({
					scope:a.scope,
					group:{
						path:a.group.path
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
	},
};
exports.e = welcomeTeams;