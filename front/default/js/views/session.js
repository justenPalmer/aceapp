jin.v.session = {
	actionShow:function(a,cb){

		var userId = jin.session.get('userId');
		a.position = 'after';
		var $el = jin.views.get$el(a);

		//logout button
		$el.show().on('click', '.logout', function(){
			jin.groups.action({
				group:{g:'users'},
				action:'logout'
			},{
				success:function(res){
					jin.go('login');
				},
				fail:function(res){
					console.log('logout fail');
				}
			});
		});
		
		jin.views.action({
			action:'bindRec',
			view:a.view,
			group:{g:'users',id:userId}
		},{
			update:function(rec){ //triggered on initial retrieval and on updates
				console.log('update retrieved:',rec);
			},
			remove:function(rec){
				jin.go('login');
			}
		});
		
		cb.success();
	}
};