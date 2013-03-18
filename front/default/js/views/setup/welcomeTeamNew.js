jin.v.welcomeTeamNew = {
	actionShow:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);

		var group = {
			g:'users',
			sort:{fName:1}
		};

		var $users = $el.find('[data-prop="users"]');

		//hide all rows
		jin.ga({group:group,action:'getRecs',key:a.view.path},{
			success:function(recs){
				console.log('getRecs:',recs);
				if (!recs ||recs.length < 1) return;

				$users.children().remove();
				$users.append('<option value="">**Select a Facilitator**</option>');
				for (var i=0,len=recs.length;i<len;i++){
					var name = jin.g.users.getName(recs[i]);
					$users.append('<option value="'+recs[i].id+'">'+name+'</option>')
				}
			},
			fail:function(res){
				console.log('get recs fail:',res);
			}
		});

		$el.on('click','.createBtn',function(){
			//check if facilitator is selected
			var facilitator = $users.val();

			if (!facilitator) return;

			jin.ga({
				action:'upsert',
				group:{g:'welcomeTeams'},
				facilitator:facilitator
			},{
				success:function(res){
					console.log('add welcome team success');
					$users.find(':selected').removeAttr('selected');
					$users.find('[value=""]').attr('selected','selected');
				},
				fail:function(res){
					console.log('add welcome team fail');
				}
			});
		});

		$el.show();
	}
};