jin.v.weekRow = {
	actionList:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);
		//iterate through weeks to show
		//show 5 weeks at first
		var startTs = jin.g.weeks.getTs(jin.g.weeks.get())+(12*jin.tools.hour);
		for (var i=0;i<5;i++){
			var weekTs = startTs-(7*jin.tools.day*i);
			var first = (i==0)? true: false;

			jin.va({
				action:'show',
				view:{
					v:a.view.v,
					parent:a.view.parent,
					group:{
						v:'weeks',
						id:jin.g.weeks.get(new Date(weekTs))
					}
				},
				first:first
			});
		}
	},
	actionShow:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);

		a.view.scope.week = a.view.group.id;

		jin.views.action({
			action:'list',
			view:{
				v:'taskRow',
				parent:a.view
			}
		});

		if (a.first) $el.find('.weekOf').addClass('label-success');

		$el.find('.addTaskButton').hide();
		jin.groups.action({
			action:'restrict',
			group:{g:'users',id:a.view.scope.userId},
			allow:['self','admin']
		},{
			success:function(){
				$el.find('.addTaskButton').show();
			}
		});

		$el.on('click', '.addTaskButton', function(){
			jin.views.action({
				action:'show',
				view:{
					v:'addTask',
					parent:a.view
				}
			});
			$el.find('.addTaskButton').hide();
		});

		jin.groups.action({
			action:'getRecs',
			group:{
				g:'taskTotals',
				find:{
					week:a.view.scope.week,
					userId:a.view.scope.userId
				}
			},
			key:a.view.path
		},{
			success:function(recs){
				//console.log('task total get rec:',recs);
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
			}
		});

		$el.find('[data-prop="weekOf"]').html(jin.g.weeks.getDisp(a.view.scope.week));

		$el.show();
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