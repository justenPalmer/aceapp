jin.v.user = {
	actionShow:function(a,cb){
		var me = this;
		a.$place = a.view.parent.$el.find('.container');
		a.position = 'html';
		var $el = jin.views.get$el(a);
		$el.show();

		a.view.scope.userId = (a.view.group && a.view.group.id)? a.view.group.id: jin.session.get('userId');


		//nav active
		jin.views.action({
			action:'active',
			active:a.view.path,
			view:{path:'home/topBar/topNav'}
		});

		//console.log('user:',a.view.scope.userId);
		jin.views.action({
			action:'bindRec',
			view:a.view,
			group:{g:'users',id:a.view.scope.userId}
		},{
			update:function(user){
				var name = jin.g.users.getName(user);
				$el.find('[data-prop="name"]').html(jin.tools.format({target:name,upper:'all'}));
				if (user.phone) $el.find('[data-prop="phoneDisp"]').html(jin.tools.format({target:user.phone,phone:'usa'}));
			}
		});

		var weekTs = jin.g.weeks.get();
		jin.groups.action({
			group:{
				g:'taskTotals',
				find:{
					week:weekTs,
					userId:a.view.scope.userId
				}
			},
			key:a.view.path,
			action:'getRecs'
		},{
			success:function(recs){
				console.log('total task recs:',recs);
				var total = recs[0];
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
					}
				});
			},
			fail:function(res){
				console.log('get task recs fail:',res);
			}
		});

		$el.on('click','.viewTasks',function(){
			jin.views.go({
				view:{
					v:'ace',
					group:{g:'users',id:a.view.scope.userId},
					parent:a.view.scope.home
				}
			});
		});

		cb.success(a);
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