jin.v.reportWeek = {
	actionList:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);
		//iterate through weeks to show
		//show 5 weeks at first
		if (!a.view.startTs) var startTs = jin.g.weeks.getTs(jin.g.weeks.get());
		else var startTs = a.view.startTs;
		for (var i=0;i<5;i++){
			var weekTs = startTs-(7*jin.tools.day*i);

			jin.views.action({
				action:'show',
				view:{
					v:a.view.v,
					parent:a.view.parent,
					group:{
						v:'weeks',
						id:jin.g.weeks.get(new Date(weekTs))
					}
				}
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
				v:'reportBar',
				parent:a.view
			}
		});

		$el.find('[data-prop="weekOf"]').html(jin.g.weeks.getDisp(a.view.scope.week));

		$el.show();
		cb.success(a);
	},
	/*
	
	*/
	actionUpdate:function(a,cb){
		var $el = jin.views.get$el(a);
		
		var tot = 0;
		var catTots = {};
		$el.find('[data-tot]:visible').each(function(){
			var $tot = $(this);
			tot += Number($tot.attr('data-tot'));
			var category = $tot.attr('data-category');
			if (!catTots[category]) catTots[category] = 0;
			catTots[category] += Number($tot.attr('data-tot'));
			//console.log('bar tot:',tot);
		});

		tot = Math.round(tot);

		//console.log('category:',a.category);
		$el.find('[data-prop="total"]').html(tot);
		if (a.category) $el.find('.total').addClass('active');
		else $el.find('.total').removeClass('active');

		//update category hours
		//console.log('cat tots:',catTots,a.view.group.id);
		for (var i in catTots){
			catTots[i] = Math.round(catTots[i]);
			$('[data-v="reportCategoryHours"][data-category="'+i+'"][data-week="'+a.view.group.id+'"]').children('[data-prop="hours"]').html(catTots[i]);
		}
	}
};