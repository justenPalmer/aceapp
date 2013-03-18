jin.v.taskDetail = {

	actionShow:function(a,cb){
		//console.log('show taskDetail:',a);
		a.position = 'after';
		var $el = jin.views.get$el(a);
		var $descForm = $el.find('.descriptionForm');
		var $descText = $el.find('.descriptionText');
		$el.find('.error').hide();
		$descForm.hide();
		$descText.show();


		$el.on('click',function(e){
			//console.log(e.target.nodeName);
			if (e.target.nodeName != 'A') return false;
		});

		var first = true;

		jin.views.action({
			action:'bindRec',
			view:a.view,
			noWrite:true
		},{
			update:function(rec){
				var userId = jin.session.get('userId');
				//console.log('userId:',rec.userId,userId);

				$descText.html(jin.tools.format({target:rec.description,paragraph:true,links:true}));
				if (first) $descForm.find('textarea').val(rec.description);
				first = false;

				//if user is owner
				jin.groups.action({
					action:'restrict',
					group:{g:'users',id:a.view.scope.userId},
					allow:['self','admin']
				},{
					success:function(){
						$descText.addClass('formActive');
						var formShown = false;
						$el.on('click', '.descriptionText', function(){
							if (formShown) {
								$descForm.hide();
								$descText.show();
								formShown = false;
							}
							else {
								formShown = true;
								$descForm.show();
								$descText.hide();
								$descForm.find('textarea').autogrow().focus().val(rec.description);
								
								setTimeout(function(){
									$('body').one('click', function(){
										$descForm.hide();
										$descText.show();
										formShown = false;
									});
								},100);
							}
						});
						//console.log('desc:',rec);
						if (!rec.description || rec.description.length < 1) {
							formShown = true;
							$descForm.show();

							console.log('newRec:',a.newRec);
							$descForm.find('textarea').autogrow();
							if (a.newRec) setTimeout(function(){
								$descForm.find('textarea').focus().val('');	
							},500);
							$descText.hide();
							
							$el.one('focus','.descriptionForm textarea',function(){
								setTimeout(function(){
									$('body').one('click', function(){
										$descForm.hide();
										$descText.show();
										formShown = false;
									});
								},100);
							});		
						}
					}
				});
			}
		});

		//password
		var timer;
		$el.find('.saved').hide();
		

		$el.on('keyup', 'textarea', function(){
			clearTimeout(timer);
			timer = setTimeout(function(){
				clearTimeout(timer);
				//console.log('desc saved');

				$el.find('.saved').show();
				setTimeout(function(){
					$el.find('.saved').fadeOut();
				},500);

				var upsert = {
					group:a.view.group,
					action:'upsert'
				};
				upsert.description = $el.find('[data-prop="descriptionText"]').val();
				if (upsert.description.length < 1) return;

				jin.groups.action(upsert,{
					success:function(res){
						$el.find('input').val('');
						$el.find('.error').hide();
					},
					fail:function(res){
						$el.find('.error').show();
						$el.find('.error').html(res.error);
					}
				});
			},1000);
		});

		
		//enter input submit
		$el.on('keydown', 'input', function(e){
			if (e.keyCode == 13) {
				$(this).blur();
			}
		});

		$el.show();

		cb.success(a);
	}
};