/*
-------
g:TASKCATEGORIES
-------
handles all tasks
*/
var jin;
var taskCategories = {
	refs:{},
	init:function(jinR){jin = jinR;},
	fields:{
		id:{max:64},
		category:{max:128,min:1}
	},
	col:'taskCategories',
	actionUpsert:function(a,cb){
		var me = this;
		jin.groups.action({
			scope:a.scope,
			action:'restrict',
			group:{g:'users'},
			allow:['admin','superAdmin']
		},{
			success:function(){
				jin.tools.validate({
					rules:me.fields,
					input:a
				},{
					success:function(vals){
						if (!vals || vals.category.length < 1) return cb.fail('no values');
						if (!a.group.id) {
							a.newRec = true;
							a.group.id = 0;
						}
						jin.query.action({
							action:'upsert',
							db:a.scope.session.agency,
							col:me.col,
							where:{id:a.group.id},
							upsert:{$set:vals}
						},{
							success:function(rec){
								if (a.newRec) { //add
									jin.groups.sendBroadcast({
										group:{
											g:'taskCategories'
										},
										action:'addRec',
										rec:rec
									});
								}
								else { //update
									jin.groups.sendBroadcast({
										group:{
											g:'taskCategories',
											id:rec.id
										},
										action:'updateRec',
										rec:rec
									});
								}
								cb.success({rec:rec});
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
	actionGetRecs:function(a,cb){
		var me = this;
		
		a.group.find = a.group.find || {};
		if (a.group.id) a.group.find = {id:a.group.id};

		//if (!agencyDb) return callbacks.fail({errors:{error:'no agency selected'}});
		jin.mongo.action({
			action:'find',
			col:me.col,
			find:a.group.find,
			sort:{category:1}, 
			limit:1000
		},{
			success:function(recs){
				if (!recs) cb.fail('no task categories');

				cb.success({recs:recs});
			}
		});

		jin.groups.joinBroadcast({
			scope:a.scope,
			group:{
				path:a.group.path
			}
		});
	},
	actionRemove:function(a,cb){
		var me = this;

		jin.groups.action({
			scope:a.scope,
			action:'restrict',
			group:{g:'users'},
			allow:['admin','superAdmin']
		},{
			success:function(){
				if (!a.group.id) return cb.fail('no id');

				jin.query.action({
					action:'remove',
					db:a.scope.session.agency,
					col:me.col,
					where:{id:a.group.id}
				},{
					success:function(rec){

						jin.groups.sendBroadcast({
							group:{
								g:'taskCategories',
								id:a.group.id
							},
							action:'removeRec',
							rec:{id:a.group.id}
						});

						cb.success({});
					}
				});
			},
			fail:function(){
				cb.fail('not allowed');
			}
		});
	},
	access:function(scope){
		return jin.g.users.access(scope);
	}
};
exports.e = taskCategories;