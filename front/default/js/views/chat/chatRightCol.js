jin.v.chatRightCol = {
	actionShow:function(a,cb){
		var me = this;
		a.$place = $('[data-place="fixedRightCol"]');
		var $el = jin.views.get$el(a);
		$el.show();

		//list chatUserRow
		jin.views.action({
			action:'list',
			view:{v:'chatUserRow',parent:a.view}
		});

		cb.success(a);
	}
};