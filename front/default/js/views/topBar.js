jin.v.topBar = {
	actionShow:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);
		$el.show();

		jin.views.action({
			action:'show',
			view:{v:'session',parent:a.view}
		});

		jin.views.action({
			action:'show',
			view:{v:'topNav',parent:a.view}
		});

		cb.success(a);
	}
};