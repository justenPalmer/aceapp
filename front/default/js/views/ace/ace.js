jin.v.ace = {
	actionShow:function(a,cb){
		var me = this;
		a.$place = a.view.parent.$el.find('.container');
		a.position = 'html';
		var $el = jin.views.get$el(a);
		$el.show();

		a.view.scope.userId = (a.view.group && a.view.group.id)? a.view.group.id: jin.session.get('userId');

		jin.views.action({
			action:'bindRec',
			view:a.view,
			group:{g:'users',id:a.view.scope.userId}
		},{
			update:function(rec){
				var name = jin.g.users.getName(rec);
				$el.find('[data-prop="name"]').html(jin.tools.format({target:name,upper:'all'}));
				if (rec.phone) $el.find('[data-prop="phone"]').val(jin.tools.format({target:rec.phone,phone:'usa'}));
			}
		});

		jin.views.action({
			action:'list',
			view:{
				v:'weekRow',
				parent:a.view
			}
		});

		jin.views.action({
			action:'list',
			view:{
				v:'userRow',
				parent:a.view
			}
		},{
			success:function(){
				jin.views.action({
					action:'active',
					view:{
						v:'userRow',
						parent:a.view,
						group:{
							g:'users',
							id:a.view.scope.userId
						}
					}
				});
			}
		});

		jin.views.action({
			action:'active',
			active:a.view.path,
			view:{path:'home/topBar/topNav'}
		});

		cb.success(a);
	}
};