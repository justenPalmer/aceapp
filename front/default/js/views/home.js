jin.v.home = {
	actionShow:function(a,cb){
		a.position = 'append';
		a.$place = $('body');
		var $el = jin.views.get$el(a);

		a.view.scope.alert = {v:'alert',parent:a.view};
		a.view.scope.home = a.view;

		$el.show();

		jin.ga({
			group:{g:'users'},
			action:'auth'
		},{
			success:function(){
				
				jin.va({
					action:'show',
					view:{v:'topBar',parent:a.view}
				});

				jin.va({
					action:'defaultView',
					view:{
						v:'ace',
						parent:a.view
					}
				});
				

				console.log('show home:',$el);

				cb.success(a);
			},
			fail:function(){
				jin.go('home/hello');
				cb.success(a);
			}
		});

		
	}
};