/*
-------
g:USERS
-------
this is a generic users group
*/
var jin;
var taskTotals = {
	refs:{},
	init:function(jinR){jin = jinR;},
	col:'taskTotals',
	fields:{
		hours:{number:true,minNum:0,maxNum:1000},
		week:{timestamp:true},
		userId:{min:1,max:64}
	},

	/*
	actionTotal (fun): standard upsert rec method
		week (num): timestamp for week
		[userId] (str): defaults to session user
	*/
	actionTotal:function(a,cb){
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
						if (!vals.week) return cb.fail('no week');
						
						vals.userId = vals.userId || a.scope.session.user.id;

						//get all tasks for week
						jin.groups.action({
							scope:a.scope,
							action:'getRecs',
							group:{g:'tasks',find:{week:a.week,userId:vals.userId}}
						},{
							success:function(res){
								var total = 0;
								var recs = res.recs;
								for (var i=0,len=recs.length;i<len;i++){
									total += recs[i].hours;
								}
								vals.total = total;

								var tangible = 0;
								var recs = res.recs;
								for (var i=0,len=recs.length;i<len;i++){
									if (recs[i].tangible) tangible += recs[i].hours;
								}
								vals.tangible = tangible;

								var update = jin.tools.morph({target:vals,clone:true,shrink:['hours']});
								console.log('upsert total:',vals);
								jin.query.action({
									action:'upsert',
									col:me.col,
									upsert:{$set:update},
									where:{userId:vals.userId,week:vals.week}
								},{
									success:function(rec){
										/*
										if (where.id == 0) {
											jin.groups.sendBroadcast({
												group:{
													g:a.group.g,
													find:{week:rec.week,userId:rec.userId}
												},
												action:'addRec',
												rec:rec
											});
										}
										else {
											*/
											jin.groups.sendBroadcast({
												group:{
													g:a.group.g,
													id:rec.id
												},
												action:'updateRec',
												rec:rec
											});
										//}

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
		//console.log('total find:',a.group.find);
		jin.query.action({
			action:'find',
			col:me.col,
			find:a.group.find,
			sort:{created:1},
			limit:500
		},{
			success:function(recs){
				jin.groups.joinBroadcast({
					scope:a.scope,
					group:{
						path:a.group.path
					}
				});

				if ((!recs || recs.length < 1) && a.group.find && a.group.find.userId && a.group.find.week) {
					jin.groups.action({
						scope:a.scope,
						action:'total',
						group:{g:'taskTotals'},
						userId:a.group.find.userId,
						week:a.group.find.week,
						hours:0
					},{
						success:function(res){
							//console.log('created total:',res);
							cb.success({recs:[res.rec]});
						},
						fail:function(res){
							console.log('create total fail:',res);
						}
					});

					return;
				}

				//console.log('task totals get recs res:',recs);
				cb.success({recs:recs});
			}
		});
	}
};
exports.e = taskTotals;