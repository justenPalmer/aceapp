jin.v.chatUserRow = {

	/*
	actionList (fun): lists all tasks
	*/
	actionList:function(a,cb){
		var me = this;
		var view = a.view;
		var $el = jin.views.get$el(a);

		var weekTs = jin.g.weeks.get();

		//get users
		jin.va({
			action:'bindRecs',
			view:a.view,
			group:{
				g:'users',
				sort:{fName:1,lName:1}
			}
		},{
			build:function(res){
				var users = res.recs;
				console.log('users:',users);
				jin.tools.loop({
					ary:users
				},{
					loop:function(loop){
						jin.va({
							action:'show',
							view:{
								v:a.view.v,
								parent:a.view.parent,
								group:{
									g:'users',
									id:users[loop.i].id
								}
							}
						});

						loop.next();
					},
					success:function(){
						cb.success(a);
					}
				});
			}
		});

		
	},
	actionShow:function(a,cb){
		//console.log('show clientRow:',a);
		var me = this;
		a.position = 'before';
		var $el = jin.views.get$el(a);

		jin.views.action({
			action:'bindRec',
			view:a.view
		},{
			update:function(user){
				var name = '';
				if (user.fName) name += user.fName;
				if (user.lName) name += ' '+user.lName;
				if (name.length < 1) name = user.username;
				$el.find('[data-prop="name"]').html(name);
				if (user.online) $el.find('[data-prop="online"]').addClass('btn-success');
				else $el.find('[data-prop="online"]').removeClass('btn-success');
			}
		});

		$el.show();


		$el.on('click','[data-prop="name"]',function(){
			jin.views.go({
				view:{
					v:'user',
					group:{
						g:'users',
						id:a.view.group.id
					},
					parent:a.view.scope.home
				}
			});
		});

		cb.success(a);
	}
};