jin.v.welcomeTeamMember = {

	/*
		actionList (fun): lists caregiver rows for setup
			search (str)
	*/
	actionList:function(a,cb){
		var me = this;
		var view = a.view;
		
		jin.va({
			action:'bindRecs',
			view:a.view,
			group:{g:'users'}
		},{
			add:function(res){
				var rec = res.rec;
				jin.va({
					action:'show',
					view:{
						v:a.view.v,
						parent:a.view.parent,
						group:{g:'users',id:rec.id}
					}
				});
			},
			build:function(res){
				var recs = res.recs;
				if (!recs ||recs.length < 1) return;
				for (var i=0,len=recs.length;i<len;i++){
					jin.va({
						action:'show',
						view:{
							v:a.view.v,
							parent:a.view.parent,
							group:{g:'users',id:recs[i].id}
						}
					});
				}
			}
		});
	},

	/*
	actionShow (fun)
	*/
	actionShow:function(a,cb){
		var me = this;
		//a.$place = a.$place || a.view.parent.$el.find('.tbody');
		//a.position = a.position || 'append';

		console.log('member:',a);

		a.$place = $('[data-welcome="none"] ul');
		a.position = 'append';
		var $el = jin.views.get$el(a);
		$el.show();

		var $name = $el.find('[data-prop="name"]');

		jin.views.action({
			action:'bindRec',
			view:a.view
		},{
			update:function(rec){
				//attach user to welcome team
				$name.html(jin.g.users.getName(rec));
				//$el.detach();
				
				if (!rec.welcomeTeam) return $('[data-welcome="none"] ul').prepend($el);

				$el.detach();
				var $team = $('[data-welcome="'+rec.welcomeTeam+'"][data-v="welcomeTeamRow"] ul.usersList');
				//console.log('$team:',$team);
				if ($team.length > 0) return $team.append($el);
				return $('[data-welcome="none"] ul').append($el);
			},
			remove:function(res){
				console.log('welcome team row remove');
				jin.va({
					action:'hide',
					view:a.view
				});
			}
		});

		$el.find('.teamBtn').remove();
		for (var i=jin.v.welcomeTeamRow.tot;i>0;i--){
			//console.log('i:',i);
			var $btn = $('<span></span>');
			$btn.addClass('btn btn-inverse teamBtn');
			$btn.attr({
				'data-team':i
			});
			$btn.html(i);
			//console.log('$btn:',$btn);
			$el.append($btn);
		}

		//delete click
		$el.on('click','.teamBtn',function(){
			var team = $(this).attr('data-team');
			var welcomeTeam = $('[data-team="'+team+'"][data-v="welcomeTeamRow"]').attr('data-welcome');
			jin.ga({
				action:'upsert',
				group:a.view.group,
				welcomeTeam:welcomeTeam
			});
		});
		
		cb.success(a);
	}
};