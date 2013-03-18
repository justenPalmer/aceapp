jin.v.welcomeTeams = {
	actionShow:function(a,cb){
		var me = this;
		a.$place = a.view.parent.$el.find('.container');
		a.position = 'html';
		var $el = jin.views.get$el(a);
		$el.show();

		//nav active
		jin.va({
			action:'active',
			active:a.view.path,
			view:a.view.scope.setup
		});

		jin.va({
			action:'list',
			view:{
				v:'welcomeTeamRow',
				parent:a.view
			}
		},{
			success:function(){
				//get users
				jin.va({
					action:'list',
					view:{
						v:'welcomeTeamMember',
						parent:a.view
					}
				});
			}
		});

		jin.va({
			action:'show',
			view:{
				v:'welcomeTeamNew',
				parent:a.view
			}
		});

		cb.success(a);
	}
};