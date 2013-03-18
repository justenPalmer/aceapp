jin.v.topNav = {
	actionShow:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);
		$el.show();

		$el.find('.setup').hide();
		jin.groups.action({
			action:'restrict',
			group:{g:'users',id:a.view.scope.userId},
			allow:['admin']
		},{
			success:function(){
				$el.find('.setup').show();
			}
		});

		jin.ga({
			action:'getUserAlert',
			group:{g:'chatAlerts'}
		},{
			fail:function(res){
				//console.log('user alert fail:',res);
			},
			success:function(res){
				//console.log('user alert:',res);
				var alert = res.rec;
				if (alert){
					jin.va({
						action:'bindRec',
						view:a.view,
						group:{
							g:'chatAlerts',
							id:alert.id
						}
					},{
						update:function(rec){
							console.log('chat alert:',rec);
							$el.find('[data-prop="chatAlerts"]').html(rec.count);
						}
					});
				}
			}
		});

		cb.success(a);
	},
	/*
	actionActive (fun): makes a nav item active
		active (fun): path of view to make active
	*/
	actionActive:function(a,cb){
		var $el = jin.views.get$el(a);
		$el.find('li.active').removeClass('active');
		$el.find('[href="#!'+a.active+'"]').parent().addClass('active');
	}
};