jin.v.chat = {
	actionShow:function(a,cb){
		var me = this;
		a.$place = a.view.parent.$el.find('.container');
		a.position = 'html';
		var $el = jin.views.get$el(a);
		$el.show();

		//add chat
		jin.views.action({
			action:'show',
			view:{v:'chatAdd',parent:a.view}
		});

		//list chatRow
		jin.views.action({
			action:'list',
			view:{v:'chatRow',parent:a.view}
		});

		jin.views.action({
			action:'show',
			view:{v:'chatRightCol',parent:a.view}
		});

		jin.views.action({
			action:'active',
			active:a.view.path,
			view:{path:'home/topBar/topNav'}
		});

		//clear alerts
		jin.ga({
			action:'clearAlerts',
			group:{
				g:'chatAlerts'
			}
		});

		cb.success(a);
	}
};