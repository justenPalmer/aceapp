jin.v.addTask = {
	actionShow:function(a,cb){
		var me = this;
		
		var $el = jin.views.get$el(a);
		$el.find('.error').hide();

		var upsert = function(){
			var upsert = {
				group:{g:'tasks'},
				action:'upsert'
			};
			upsert.category = $el.find('[data-prop="category"]').attr('data-id');
			upsert.hours = $el.find('[data-prop="hours"]').val();
			upsert.week = a.view.scope.week;
			upsert.userId = a.view.scope.userId;
			upsert.tangible = ($el.find('[data-prop="tangible"]').is(':checked'))? true:false;

			if (upsert.hours.length < 1 || !upsert.category || upsert.category.length < 1) return;

			//console.log('task upsert sent:',upsert);

			jin.groups.action(upsert,{
				success:function(res){
					$el.find('[data-prop="category"]').attr('data-id','');
					$el.find('input').val('');
					$el.find('.error').hide();
					a.view.parent.$el.find('.addTaskButton').show();
					jin.views.action({
						action:'hide',
						view:a.view
					});
				},
				fail:function(res){
					$el.find('.error').show();
					$el.find('.error').html(res.error);
				}
			});
		};
		/*
		$el.on('change', '[data-prop="category"]', function(){
			console.log('category change triggered');
			upsert();
		});
		*/
		$el.on('focusout', '[data-prop="hours"]', function(){
			//console.log('category change triggered');
			upsert();
		});

		$el.on('keyup','[data-prop="tangible"]',function(e){
			if (e.keyCode == 13){ //enter
				if ($(this).is(':checked')){
					$(this).removeAttr('checked');
				}
				else {
					$(this).attr({checked:'checked'});
				}
			}
		});

		/*
		$el.find('select').append('<option value="">**Select Category**</option>');
		jin.views.action({
			action:'bindRecs',
			group:{g:'categories',sort:{category:1}},
			view:a.view
		},{
			build:function(res){
				for (var i=0,len=res.recs.length;i<len;i++){
					var rec = res.recs[i];
					$el.find('select').append('<option value="'+rec.id+'">'+rec.category+'</option>');
				}	
			}
		});
		*/

		//auto complete
		jin.views.action({
			action:'show',
			view:{
				v:'inputAC',
				parent:a.view
			},
			$input:$el.find('[data-prop="category"]'),
			$container:$el.find('.dropdown'),
			group:{g:'categories',sort:{category:1}}
		},{
			row:function(row){
				row.$row.html(row.rec.category);
			},
			select:function(row){
				//row selected
				console.log('select:',row);
				row.$input.val(row.rec.category).attr('data-id',row.rec.id);
				upsert();
			},
			check:function(check){
				if (!check.rec.category) return false;
				if (!check.val) return true;
				var search = jin.tools.format({lower:'all',target:check.rec.category});
				var val = jin.tools.format({lower:'all',target:check.val});
				if (search.indexOf(val) === 0) return true;
				return false;
			}
		});

		//enter input submit
		$el.on('keydown', '[data-prop="hours"]', function(e){
			if (e.keyCode == 13) { //enter
				$(this).blur();
			}
		});

		$el.on('click', ':not([data-prop="tangible"])',function(){
			return false;
		});

		setTimeout(function(){
			$('body').one('click',function(e){
				if ($(e.target).is('[type="checkbox"]')) return;
				jin.views.action({
					action:'hide',
					view:a.view
				});
				a.view.parent.$el.find('.addTaskButton').show();
			});
		},500);	

		$el.show();
		$el.find('[data-prop="tangible"]').focus();

		cb.success(a);
	}
};