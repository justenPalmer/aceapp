jin.v.chatAdd = {
	actionShow:function(a,cb){
		var me = this;
		
		var $el = jin.views.get$el(a);
		$el.find('.error').hide();

		var upsert = function(){
			var upsert = {
				group:{g:'chat'},
				action:'upsert'
			};
			upsert.message = $el.find('[data-prop="message"]').val();

			if (!upsert.message || upsert.message.length < 1) return;

			jin.groups.action(upsert,{
				success:function(res){
					jin.ga({
						action:'add',
						group:{
							g:'chatAlerts'
						}
					});

					$el.find('textarea').val('');
					$el.find('.error').hide();
				},
				fail:function(res){
					$el.find('.error').show();
					$el.find('.error').html(res.error);
				}
			});
		};

		$el.on('click', '.addBtn', function(){
			upsert();
		});

		$el.on('keyup','[data-prop="message"]',function(e){
			if (e.keyCode == 13){
				upsert();
			}
		});

		$el.show();

		$('body').scrollTop(99999999);
		cb.success(a);
	}
};