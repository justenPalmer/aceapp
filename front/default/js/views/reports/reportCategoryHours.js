jin.v.reportCategoryHours = {
	actionList:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);

		//iterate over weeks
		var startTs = jin.g.weeks.getTs(jin.g.weeks.get());
		for (var i=0;i<5;i++){
			var weekTs = startTs-(7*jin.tools.day*i);

			jin.va({
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

		$el.attr({
			'data-category':a.view.scope.category.id,
			'data-week':a.view.group.id
		});

		$el.show();
		cb.success(a);
	}
};