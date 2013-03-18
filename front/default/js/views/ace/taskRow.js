jin.v.taskRow = {

	/*
	actionList (fun): lists all tasks
	*/
	actionList:function(a,cb){
		var me = this;
		var view = a.view;
		var $el = jin.views.get$el(a);

		var group = {
			g:'tasks',
			find:{week:a.view.scope.week,userId:a.view.scope.userId}
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
					rec:res.rec,
					newRec:true
				}
				me.addRow(add);
			}
		});

		//reset hours
		/*
		jin.g.weeks.resetHours({
			group:{g:'weeks',id:a.view.scope.week}
		});
*/

		jin.groups.action({
			group:group,
			key:a.view.path,
			action:'getRecs'
		},{
			success:function(recs){
				//console.log('task recs:',recs);
				var curRow = 0;
				
				if (!recs) return;
				if (!a.search) a.search = '';
				a.search.toLowerCase();

				for (var i=0,len=recs.length;i<len;i++){
					var str = '';
					if (recs[i].task) str += recs[i].task.toLowerCase();
					if (recs[i].description) str += ' '+recs[i].description.toLowerCase();
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
		console.log('add row:',a);
		jin.views.action({
			action:'show',
			view:{
				v:a.view.v,
				parent:a.view.parent,
				group:{
					g:'tasks',
					id:a.rec.id
				}
			},
			newRec:a.newRec
		});
	},
	actionShow:function(a,cb){
		//console.log('show taskRow:',a);
		a.position = 'before';
		var $el = jin.views.get$el(a);

		jin.views.action({
			action:'bindRec',
			view:a.view
		},{
			update:function(rec){
				//console.log('rec:',rec,$el.find('.hoursInput'));
				
				if (rec.category) {
					jin.views.action({
						action:'bindRec',
						view:a.view,
						group:{g:'categories',id:rec.category}
					},{
						update:function(category){
							if (rec.tangible !== undefined && rec.tangible == false) $el.find('[data-prop="intangible"]').addClass('label').html('intangible');
							$el.find('[data-prop="categoryName"]').html(category.category);
							$el.find('.hoursInput').val(rec.hours);
						}
					});
				}
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
			allow:['self','admin']
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

		$el.on('focusout', '.hoursInput', function(){
			console.log('hours change triggered');

			var upsert = {
				group:{g:'tasks',id:a.view.group.id},
				action:'upsert'
			};
			upsert.hours = $el.find('.hoursInput').val();

			if (upsert.hours.length < 1) return;

			//console.log('task upsert sent:',upsert);

			jin.groups.action(upsert,{
				success:function(res){
					$el.find('.hoursInput').hide();
					$el.find('.hours').show();

					//show notification
					jin.views.action({
						action:'show',
						view:a.view.scope.alert,
						alert:'Task updated',
						type:'info',
						fadeOut:1000
					});
				},
				fail:function(res){
					//show alert error
					jin.views.action({
						action:'show',
						view:a.view.scope.alert,
						alert:res.error,
						type:'warning',
						buttons:[
							{label:'close'}
						],
						fadeOut:5000
					});
				}
			});
		});

		//enter input submit
		$el.on('keydown', 'input', function(e){
			if (e.keyCode == 13) {
				$(this).blur();
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

		jin.views.action({
			action:'show',
			view:{
				v:'taskDetail',
				parent:a.view,
				group:a.view.group
			},
			newRec:a.newRec
		});

		if (a.active) $el.addClass('selected');
		$el.show();

		cb.success(a);
	},
	actionActive:function(a,cb){
		var me = this;
		$el = jin.views.get$el(a);
		
		$el.parent().find('.selected').removeClass('selected');
		$el.addClass('selected');
	}
};