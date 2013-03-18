jin.v.reports = {
	actionShow:function(a,cb){
		var me = this;
		a.$place = a.view.parent.$el.find('.container');
		a.position = 'html';
		var $el = jin.views.get$el(a);
		$el.show();

		//nav active
		jin.views.action({
			action:'active',
			active:a.view.path,
			view:{path:'home/topBar/topNav'}
		});


		$el.on('click','.export',function(){
			var startTs = jin.g.weeks.getTs(jin.g.weeks.get());
			jin.groups.action({
				action:'export',
				group:{
					g:'tasks',
					find:{week:$('.weeks').val()},
				},
				go:true
			});
		});

		if (!a.view.week) var startTs = jin.g.weeks.getTs(jin.g.weeks.get());
		else var startTs = jin.g.weeks.getTs(a.view.week);
		//console.log('startTs:',startTs);
		for (var i=0;i<5;i++){
			var weekTs = startTs-(7*jin.tools.day*i);
			var lastDay = weekTs+(6*jin.tools.day);
			var val = jin.g.weeks.get(new Date(weekTs));
			var disp = ''+jin.g.weeks.getDisp(val);
			$('.weeks').append('<option value="'+val+'">'+disp+'</option>')
		}

		jin.va({
			action:'list',
			view:{
				v:'reportWeek',
				startTs:startTs,
				parent:a.view
			}
		});

		jin.va({
			action:'list',
			view:{
				v:'reportCategoryList',
				parent:a.view
			}
		});

		//populate period options
		var periods = [
			{disp:'By Weeks',val:'week'},
			{disp:'By Months',val:'month'}
		]	
		var $period = $el.find('[data-prop="period"]');
		for (var i=0,len=periods.length;i<len;i++){
			$period.append('<option value="'+periods[i].val+'">'+periods[i].disp+'</option>');
		}

		$el.on('click','.older',function(){
			var weekTs = startTs-(7*jin.tools.day*5);
			var lastDay = weekTs+(6*jin.tools.day);
			var val = jin.g.weeks.get(new Date(weekTs));
			console.log('show older:',val);
			jin.views.go({
				action:'show',
				view:{
					v:a.view.v,
					week:val,
					parent:a.view.parent
				}
			});
		});

		$el.on('click','.newer',function(){
			var weekTs = startTs+(7*jin.tools.day*5);
			var lastDay = weekTs+(6*jin.tools.day);
			var val = jin.g.weeks.get(new Date(weekTs));
			console.log('show newer:',val);
			jin.views.go({
				action:'show',
				view:{
					v:a.view.v,
					week:val,
					parent:a.view.parent
				}
			});
		});

	},

	actionUpdate:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);

		$el.find('[data-v="reportWeek"]').each(function(){
			var $week = $(this);
			var path = $week.attr('data-path');

			jin.va({
				action:'update',
				view:{path:path},
				category:a.category
			});
		});
	}
};