jin.v.pioneers = {
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
			view:a.view.scope.setup
		});

		jin.views.action({
			action:'show',
			view:{
				v:'pioneerRowNew',
				parent:a.view
			}
		});
		jin.views.action({
			action:'list',
			view:{
				v:'pioneerRow',
				parent:a.view
			}
		},{
			success:function(){
				
			}
		});

		cb.success(a);
	}
};