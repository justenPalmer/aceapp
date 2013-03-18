jin.v.login = {
	actionShow:function(a, cb){
		a.$place = $('body');
		a.position = 'append';
		var $el = jin.views.get$el(a);
		
		$el.find('.error').hide();
		$el.show();

		//password
		$el.on('focusout', 'input', function(){

			var username = $('[name="username"]').val();
			var password = $('[name="password"]').val();

			if (username.length < 1 || password.length < 1) return;

			jin.groups.action({
				group:{g:'users'},
				action:'login',
				username:username,
				password:password
			},{
				success:function(res){
					$el.find('.error').hide();
					console.log('login success:',res);
					window.location = '/#!home';
				},
				fail:function(res){
					$el.find('.error').show();
					console.log('login fail:',res);
					$el.find('.error').html(res.error);
				}
			});
		});
		//enter input submit
		$el.on('keydown', 'input', function(e){
			if (e.keyCode == 13) {
				$(this).blur();
			}
		});
		
		cb.success();
	}
};