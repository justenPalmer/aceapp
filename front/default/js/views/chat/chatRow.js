jin.v.chatRow = {

	/*
	actionList (fun): lists all tasks
	*/
	actionList:function(a,cb){
		var me = this;
		var view = a.view;
		var $el = jin.views.get$el(a);

		var group = {
			g:'chat'
		};
		//console.log('task group:',group);
		var $parent = view.parent.$el;
		var maxRows = 500;

		jin.views.action({
			view:view,
			action:'bindGroup',
			group:group
		},{
			add:function(res){
				var add = {
					view:a.view,
					rec:res.rec
				}
				me.addRow(add);
			}
		});

		jin.groups.action({
			group:group,
			key:a.view.path,
			action:'getRecs'
		},{
			success:function(recs){
				//console.log('chat recs:',recs);
				var curRow = 0;
				
				if (!recs) return;
				if (!a.search) a.search = '';
				a.search.toLowerCase();

				for (var i=0,len=recs.length;i<len;i++){
					var str = '';
					var pos = str.indexOf(a.search);
					if (pos != 0 || a.search == '') { //user is in search
						var add = {
							view:a.view,
							rec:recs[i]
						}
						me.addRow(add);
						curRow++;
						if (curRow >= maxRows) return;
					}
				}
			},
			fail:function(res){
				console.log('get task recs fail:',res);
			}
		});
	},
	addRow:function(a){
		jin.views.action({
			action:'show',
			view:{
				v:a.view.v,
				parent:a.view.parent,
				group:{
					g:'chat',
					id:a.rec.id
				}
			}
		});
	},
	actionShow:function(a,cb){
		//console.log('show chat row:',a);
		a.position = 'before';
		var $el = jin.views.get$el(a);
		var userId = 0;

		jin.views.action({
			action:'bindRec',
			view:a.view
		},{
			update:function(rec){
				//console.log('rec:',rec);

				if (rec.created){

					var setDate = function(){
						var ago = jin.tools.date({
							ts:rec.created,
							get:'ago'
						});
						if (ago.length > 0) $el.find('[data-prop="date"]').html('('+ago+') ');
						var curD = new Date();
						if (curD.getTime() - rec.created < 1000*60*60){ 
							setTimeout(function(){
								setDate();
							},1000*60);
						}
					};
					setDate();
				}
				
				if (rec.userId) {
					jin.views.action({
						action:'bindRec',
						view:a.view,
						group:{g:'users',id:rec.userId}
					},{
						update:function(user){
							$el.find('[data-prop="name"]').html(user.fName+' '+user.lName);
						}
					});

					userId = rec.userId;
				}

				//move div to bottom
				$('body').scrollTop(99999999);
			},
			remove:function(){
				jin.views.action({
					action:'hide',
					view:a.view
				});
			}
		});

		$el.find('.remove').hide();
		$el.find('.hoursInput').hide();
		jin.groups.action({
			action:'restrict',
			group:{g:'users',id:a.view.scope.userId},
			allow:['self']
		},{
			success:function(){
				$el.find('.remove').show();
				$el.find('.hours').addClass('formActive');

				$el.on('click','.hours',function(){
					$el.find('.hours').hide();
					$el.find('.hoursInput').show();

					setTimeout(function(){
						$el.find('.hoursInput').focus();
					},100);
				});
			}
		});

		//remove button
		$el.on('click', '.remove', function(){
			//delete alert
			jin.views.action({
				action:'show',
				view:a.view.scope.alert,
				alert:'Are you sure you want to remove this task?',
				overlay:true,
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

		//username click
		$el.on('click','[data-prop="name"]',function(){
			if (!userId) return;
			jin.views.go({
				view:{
					v:'user',
					group:{
						g:'users',
						id:userId
					},
					parent:a.view.scope.home
				}
			});
		});

		//show all chat 

		if (a.active) $el.addClass('selected');
		$el.show();

		cb.success(a);
	}
};