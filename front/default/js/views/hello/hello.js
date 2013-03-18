jin.v.hello = {
	actionShow:function(a,cb){
		var me = this;
		console.log('view:',a.view);
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

		$el.on('click','.loginBtn',function(){
			jin.go('login');
		});

		cb.success(a);
	}
};