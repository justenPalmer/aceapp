jin.v.welcomeTeamRow = {

	/*
		actionList (fun): lists caregiver rows for setup
			search (str)
	*/
	actionList:function(a,cb){
		var me = this;
		var view = a.view;

		me.tot = 0;
		
		jin.va({
			action:'bindRecs',
			view:a.view,
			group:{g:'welcomeTeams'}
		},{
			add:function(res){
				var rec = res.rec;
				me.tot++;
				jin.va({
					action:'show',
					view:{
						v:a.view.v,
						parent:a.view.parent,
						group:{g:'welcomeTeams',id:rec.id}
					},
					num:me.tot
				});
			},
			build:function(res){
				var recs = res.recs;
				if (!recs ||recs.length < 1) return;
				for (var i=0,len=recs.length;i<len;i++){
					me.tot++;
					jin.va({
						action:'show',
						view:{
							v:a.view.v,
							parent:a.view.parent,
							group:{g:'welcomeTeams',id:recs[i].id}
						},
						num:me.tot
					});
				}
				cb.success(a);
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
		var $el = jin.views.get$el(a);
		$el.attr({
			'data-welcome':a.view.group.id,
			'data-team':a.num
		});
		$el.show();

		$el.find('.btn.team').html(a.num);

		a.rec = {};

		jin.views.action({
			action:'bindRec',
			view:a.view
		},{
			update:function(rec){
				if (rec.facilitator){
					jin.va({
						action:'bindRec',
						view:a.view,
						group:{
							g:'users',
							id:rec.facilitator
						}
					},{
						update:function(user){
							var name = jin.g.users.getName(user);
							$el.find('[data-prop="nameFac"]').html(name);
						}
					});
				}

				if (rec.users){
					
				}
			},
			remove:function(res){
				console.log('welcome team row remove');
				jin.va({
					action:'hide',
					view:a.view
				});
			}
		});

		$el.find('ul').sortable();

		//delete click
		$el.on('click', '.deleteBtn', function(){
			//delete alert
			jin.views.action({
				action:'show',
				view:a.view.scope.alert,
				alert:'Are you sure you want to remove this Welcome Team?',
				type:'warning',
				buttons:[
					{label:'Remove',type:'warning',cb:function(){
						jin.groups.action({
							group:a.view.group,
							action:'remove'
						});
					}},
					{label:'Cancel'}
				]
			});
		});
		
		cb.success(a);
	}
};