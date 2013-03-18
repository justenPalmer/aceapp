jin.v.categoryRowNew = {
	actionShow:function(a,cb){
		var $el = jin.views.get$el(a);
		var view = a.view;
		var me = this;
		
		var group = {
			g:'categories'
		};
		$el.show();
		
		me.selIndex = 0;
		me.recCreated = false;
		$el.on('focusout', 'input', function(){
			var $input = $(this);

			var send = {
				group:group,
				action:'upsert'
			};
			send[$input.attr('data-prop')] = $input.val();
			
			me.selIndex = $el.find('input').index(this);
			me.recCreated = true;
			
			//console.log('setupAdminRow:', data);
			jin.groups.action(send, {
				success:function(res){
					$el.find('input').val('');

					//show notification
					jin.views.action({
						action:'show',
						view:a.view.scope.alert,
						alert:'Category added',
						type:'success',
						fadeOut:1000
					});
				},
				fail:function(res){
					//show alert error
					jin.views.action({
						action:'show',
						view:a.view.scope.alert,
						alert:res.error,
						type:'warning',
						buttons:[
							{label:'close'}
						],
						fadeOut:5000
					});
				}
			});
		});

		$el.on('keydown', 'input', function(e){
			if (e.keyCode == 13) {
				$(this).blur();
				$el.find("input:eq(" + (view.$el.find("input").index(this) + 1) + ")").focus();
			}
		});
		
		cb.success(a);
	}
};