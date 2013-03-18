jin.v.setup = {
	actionShow:function(a,cb){
		var me = this;
		a.$place = a.view.parent.$el.find('.container');
		a.position = 'html';
		var $el = jin.views.get$el(a);
		$el.show();

		var userId = jin.session.get('userId');

		a.view.scope.setup = a.view;

		//nav active
		jin.views.action({
			action:'active',
			active:a.view.path,
			view:{path:'home/topBar/topNav'}
		});

		cb.success(a);
	},
	actionActive:function(a,cb){
		var $el = jin.views.get$el(a);
		$el.find('li .btn-success').removeClass('btn-success');
		$el.find('[href="#!'+a.active+'"]').addClass('btn-success');
	}
};