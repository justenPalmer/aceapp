/*
-------
g:USERS
-------
this is a generic users group
*/
var jin;
var path = require('path');
var tasks = {
	refs:{},
	init:function(jinR){jin = jinR;},
	col:'tasks',
	fields:{
		category:{min:1,max:255},
		description:{min:1,max:3000},
		hours:{number:true,minNum:0,maxNum:100},
		week:{min:1,max:10},
		userId:{id:true},
		tangible:{bool:true}
	},


	/*
	actionExport (fun)
		group (obj)
		week
	*/
	actionExport:function(a,cb){
		var me = this;

		jin.groups.action({
			scope:a.scope,
			action:'restrict',
			group:{g:'users'},
			allow:['admin','pioneer']
		},{
			success:function(){

				var file = 'OC_Export_'+a.group.find.week+'.csv';
				var filename = path.basename(file);

				a.scope.request.res.writeHead(200, {
					'Content-disposition':'attachment; filename=' + filename,
					'Content-type': 'text/csv'
				});

			  	var heading = [
					'Pioneer','Category','Hours','Tangible','Description','Updated'
				];

				var output = '';
				for (var i=0,len=heading.length;i<len;i++){
					output += ''+heading[i]+'';
					if (i!=len-1){ //not first and not last
						output += ',';
					}
				}
				output += '\n';

				//console.log('export offset:',a.localOffset);

				jin.groups.action({
					action:'getRecs',
					group:a.group,
					scope:a.scope
				},{
					success:function(res){
						var tasks = res.recs;

						if (!tasks) return cb.fail('no records from this week');

						jin.tools.loop({
							ary:tasks
						},{
							loop:function(loop){

								var task = tasks[loop.i];

								jin.groups.action({
									action:'getName',
									group:{g:'users',id:task.userId}
								},{
									success:function(userRes){
										var name = userRes.name;

										var write = function(){
											output += name;
											output += ',';
											output += category;
											output += ',';
											output += task.hours;
											output += ',';
											output += (task.tangible)? 'y':'n';
											output += ',';
											output += (task.description)? task.description.replace(/\n/g,'').replace(/\,/g,'').replace(/\"/g, ''):'';
											output += ',';
											output += (task.updated)? jin.tools.date({ts:task.updated,get:'mdy'}):'';
											output += '\n';

											loop.next();
										}

										var category = '';
										if (task.category){
											jin.groups.action({
												action:'getRecs',
												group:{g:'categories',id:task.category},
												scope:a.scope
											},{
												success:function(catRes){
													console.log('catRes',catRes);
													if (!catRes.recs || !catRes.recs[0]) category = '[category removed]';
													else category = catRes.recs[0].category;
													write();
												}
											});
											return;
										}
										write();
										
										
									}
								});
							},
							success:function(){ //done w loop
								a.scope.request.res.end(output);
							}
						});
					}
				});
			}
		});
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
						//if (!vals.week) return cb.fail('no week');

						vals.userId = vals.userId || a.scope.session.user.id;
						var where = a.group.id? {id:a.group.id}: {id:0};

						jin.query.action({
							action:'upsert',
							col:me.col,
							upsert:{$set:vals},
							where:where
						},{
							success:function(rec){

								jin.groups.action({
									scope:a.scope,
									action:'total',
									group:{g:'taskTotals'},
									week:rec.week,
									userId:rec.userId
								});

								if (where.id == 0) {
									/*
									console.log('send broadcast:',{
											g:a.group.g,
											find:{week:rec.week,userId:rec.userId}
										});
*/
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
		console.log('find:',a.group.find);
		var sort = a.group.sort || {created:1};
		jin.query.action({
			action:'find',
			col:me.col,
			find:a.group.find,
			sort:sort,
			limit:500
		},{
			success:function(recs){
				//console.log('tune into bc:',a.group.path);
				jin.groups.joinBroadcast({
					scope:a.scope,
					group:{
						g:'tasks',
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
						if (!recs || !recs[0]) return cb.fail('task not found');
						var task = recs[0];
						jin.query.action({
							action:'remove',
							col:me.col,
							where:{id:a.group.id}
						},{
							success:function(rec){
								jin.groups.action({
									scope:a.scope,
									action:'total',
									group:{g:'taskTotals'},
									week:task.week,
									userId:task.userId
								});

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


	actionUpdateWeeks:function(a,cb){
		var me = this;

		jin.query.action({
			action:'find',
			col:me.col,
			find:{}
		},{
			success:function(recs){
				jin.tools.loop({
					ary:recs
				},{
					loop:function(loop){
						var rec = recs[loop.i];

						jin.groups.action({
							scope:a.scope,
							action:'total',
							group:{g:'taskTotals'},
							week:rec.week,
							userId:rec.userId
						});
						loop.next();
						/*
						var D = new Date(rec.week);
						var week = D.getFullYear()+'-'+(D.getMonth()+1)+'-'+D.getDate();
						var update = {
							week:week
						}
						console.log('ts:',rec.week,'update:',update);
						jin.query.action({
							action:'update',
							col:me.col,
							where:{id:rec.id},
							update:{$set:update}
						},{
							success:function(){
								loop.next();
							}
						});
						*/
					}
				});
			}
		});
	},


	actionUpgradeWeeks:function(a,cb){
		var me = this;

		jin.query.action({
			action:'find',
			col:me.col,
			where:{week:{$exists:true}}
		},{
			success:function(recs){
				for (var i=0,len=recs.length;i<len;i++){
					var week = String(recs[i].week);
					if (week.indexOf('-') !== -1){
						var D = me.getD(week);
						var newD = new Date(D.getTime() + jin.tools.day);
						var newWeek = me.getWeek(newD);
						console.log('old week:',week,' new week:',newWeek);

						jin.query.action({
							action:'update',
							col:me.col,
							where:{id:recs[i].id},
							update:{$set:{week:newWeek}}
						});
					}
				}
			}
		});

	},

	/*
	get (fun): gets first day of week timestamp
	*/
	getWeek:function(D){
		if (!D) D = new Date();

		//advance one day week end

		//set week with mm-dd-yyyy for first day of week
		var dow = D.getDay();
		
		if (dow == 0){
			dow = 6; //move sunday to the end of the week
		}
		else {
			dow -= 1;
		}

		var firstD = new Date(D.getTime() - jin.tools.day*dow);
		return firstD.getFullYear()+'-'+(firstD.getMonth()+1)+'-'+firstD.getDate();

		//return D.setHours(0,0,0,0) - jin.tools.day*D.getDay();
		//return new Date(D.getFullYear(), D.getMonth(), D.getDate()).getTime() - (jin.tools.day*D.getDay());
	},

	getD:function(week){
		var wAry = week.split('-');
		return new Date(wAry[0],wAry[1]-1,wAry[2]);
	},

	getTs:function(week){
		var me = this;
		return me.getD(week).getTime();
	}
};
exports.e = tasks;