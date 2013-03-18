jin.v.userRow = {

	/*
	actionList (fun): lists all tasks
	*/
	actionList:function(a,cb){
		var me = this;
		var view = a.view;
		var $el = jin.views.get$el(a);

		var weekTs = jin.g.weeks.get();

		var group = {
			g:'taskTotals',
			find:{week:weekTs}
		};
		//console.log('task total group:',group);
		//var $parent = view.parent.$el;

		/*
		jin.views.action({
			view:view,
			action:'bindGroup',
			group:group
		},{
			add:function(res){
				var add = {
					view:a.view,
					rec:res.rec
				}
				me.addRow(add);
			}
		});
		*/

		//get users
		jin.groups.action({
			action:'getRecs',
			key:a.view.path,
			group:{
				g:'users',
				sort:{fName:1,lName:1}
			}
		},{
			success:function(users){
				//console.log('users:',users);
				jin.tools.loop({
					ary:users
				},{
					loop:function(loop){
						var i = loop.i;
						//console.log('user id:',users[i]);
						jin.groups.action({
							group:{
								g:'taskTotals',
								find:{
									week:weekTs,
									userId:users[i].id
								}
							},
							key:a.view.path,
							action:'getRecs'
						},{
							success:function(recs){
								//console.log('total task recs:',recs);
								var curRow = 0;

								var total = recs[0];
								var add = {
									view:a.view,
									rec:total
								}
								me.addRow(add);
								loop.next();
							},
							fail:function(res){
								console.log('get task recs fail:',res);
							}
						});
					},
					success:function(){
						cb.success(a);
					}
				});
			}
		});

		
	},
	addRow:function(a){
		jin.views.action({
			action:'show',
			view:{
				v:a.view.v,
				scope:{total:a.rec},
				parent:a.view.parent,
				group:{
					g:'users',
					id:a.rec.userId
				}
			}
		});
	},
	actionShow:function(a,cb){
		//console.log('show clientRow:',a);
		var me = this;
		a.position = 'before';
		var $el = jin.views.get$el(a);

		jin.views.action({
			action:'bindRec',
			view:a.view
		},{
			update:function(user){
				var name = '';
				if (user.fName) name += user.fName;
				if (user.lName) name += ' '+user.lName;
				if (name.length < 1) name = user.username;
				$el.find('[data-prop="name"]').html(name);
			}
		});


		var total = a.view.scope.total;
		jin.views.action({
			action:'bindRec',
			view:a.view,
			group:{
				g:'taskTotals',
				id:total.id
			}
		},{
			update:function(rec){
				//console.log('update total rec:',recs);
				a.total = rec.total;
				a.tangible = rec.tangible;
				me.actionUpdate(a);	
				
				$el.on('click',function(){
					jin.views.go({
						view:{
							v:'ace',
							parent:a.view.scope.home,
							group:{
								g:'users',
								id:rec.userId
							}
						}
					});
				});
			}
		});

		if (a.active) $el.addClass('selected');
		$el.show();

		cb.success(a);
	},
	actionActive:function(a,cb){
		console.log('active:',a);
		var me = this;
		$el = jin.views.get$el(a);
		
		$el.parent().find('.selected').removeClass('selected');
		$el.addClass('selected');
	},

	actionUpdate:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);
		var minHours = 4;
		var maxHours = 40;

		var tanBar = me.getBarSize(a.tangible);
		var totBar = me.getBarSize(a.total);

		$el.find('.bar.tanBar').css({width:tanBar.w+'%'}).removeClass('low med high extreme').addClass(tanBar.cl);
		$el.find('.bar.totBar').css({width:totBar.w+'%'}).removeClass('low med high extreme');
		$el.find('[data-prop="tangibleHours"]').html(a.tangible);
		$el.find('[data-prop="totalHours"]').html(a.total);
	},

	getBarSize:function(hours){
		if (hours < 4){
			var w = (hours/4)*25;
			var cl = 'low';
		}
		else if (hours < 12){
			var w = (hours/12)*25+25;
			var cl = 'med';
		}
		else if (hours < 40){
			var w = (hours/40)*25+50;
			var cl = 'high';
		}
		else {
			var w = (hours/120)*25+75;
			var cl = 'extreme';
		}
		return {w:w,cl:cl};
	}
};