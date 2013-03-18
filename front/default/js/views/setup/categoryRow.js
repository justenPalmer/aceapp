jin.v.categoryRow = {

	/*
		actionList (fun): lists caregiver rows for setup
			search (str)
	*/
	actionList:function(a,cb){
		var me = this;
		var view = a.view;

		if (!a.search) a.search = '';

		var group = {
			g:'categories'
		};

		var maxRows = 30;
		var curRow = 0;
		
		//bind to group
		jin.views.action({
			view:view,
			action:'bindGroup',
			group:group
		},{
			add:function(res){
				console.log('addView:',res);
				me.addRow(a,group,res.rec);
			}
		});

		//hide all rows
		jin.groups.action({group:group,action:'getRecs',key:a.view.path},{
			success:function(recs){
				console.log('getRecs:',recs);
				if (!recs ||recs.length < 1) return;
				a.search = a.search.toLowerCase();
				for (var i=0,len=recs.length;i<len;i++){
					if (recs[i].fName && recs[i].lName) {
						var name = (recs[i].fName+' '+recs[i].lName).toLowerCase();
						var lPos = recs[i].fName.length+1;
						var pos = name.indexOf(a.search);
					}
					else if (recs[i].fName || recs[i].lName) {
						var name = recs[i].fName || recs[i].lName;
						var pos = name.toLowerCase().indexOf(a.search);
					}
					else {
						var pos = -1;
					}
					if (pos == 0 || pos == lPos || a.search == '') { //user is in search
						me.addRow(a,group,recs[i]);
						curRow++;
						if (curRow > maxRows) return;
					}
					else { //hide view
						jin.views.action({
							action:'hide',
							view:{
								v:a.view.v,
								parent:a.view.parent,
								group:{
									g:'categories',
									id:recs[i].id
								}
							}
						});
					}
				}
			},
			fail:function(res){
				console.log('get recs fail:',res);
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
		$el.show();

		a.rec = {};

		jin.views.action({
			action:'bindRec',
			view:a.view
		},{
			update:function(rec){
				a.rec = rec;
				$el.find('[data-prop="phone"]').val(jin.tools.format({target:rec.phone,phone:'usa'}));
				
				if (rec.isPassword){ //password
					$el.find('.password').hide();
					$el.find('.resetPassword').show();
				}
				else { //no password
					$el.find('.resetPassword').hide();
					$el.find('.password').show();
				}
			},
			remove:function(res){
				console.log('caregiver row remove');
				jin.views.action({
					action:'hide',
					view:a.view
				});
			}
		});
		
		//reset password click
		$el.on('click', '.resetPassword', function(){
			var $reset = $(this);
			$reset.hide();
			$reset.siblings('.password').show().focus();
		});
		
		//delete click
		$el.on('click', '.remove', function(){
			//delete alert
			jin.views.action({
				action:'show',
				view:a.view.scope.alert,
				alert:'Are you sure you want to remove this category?',
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
		
		$el.on('focusout', 'input', function(){
			var $input = $(this);
			var attr = $input.attr('data-prop');

			var send = {
				group:a.view.group,
				action:'upsert',
				id:a.rec.id
			};
			send[attr] = $input.val();
			
			if (attr == 'phone') {
				var phone = $input.val().replace(/\-/g, '');
				if (a.rec[attr] != phone) var changed = true;
				send[attr] = phone;
			}
			else {
				if (a.rec[attr] != $input.val()) var changed = true;
			}
			
			if (!changed) return;
			//console.log('setupAdminRow:', data);
			jin.groups.action(send, {
				success:function(res){
					//show notification
					jin.views.action({
						action:'show',
						view:a.view.scope.alert,
						alert:'Category updated',
						type:'success',
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
		$el.on('keydown', 'input', function(e){
			if (e.keyCode == 13) {
				$(this).blur();
				$el.find("input:eq(" + ($el.find("input").index(this) + 1) + ")").focus();
			}
		});

		cb.success(a);
	},

	/*
	addRow (fun): add a caregiver row
	*/
	addRow:function(a,group,rec){
		var view = a.view;
		var show = {action:'show'};
		show.view = {
			v:view.v,
			parent:view.parent,
			group:{g:'categories',id:rec.id}
		}
		if (jin.v.pioneerRowNew.recCreated) {
			show.$place = view.parent.$el.find('[data-place="categoryRowNew"]');
			show.position = 'after';
		}
		jin.views.action(show,{
			success:function(added){
				if (jin.v.pioneerRowNew.recCreated) {
					console.log('selIndex:',jin.v.pioneerRowNew.selIndex);
					added.view.$el.find('input:eq('+(jin.v.pioneerRowNew.selIndex+1)+')').focus();
					jin.v.pioneerRowNew.recCreated = false;
				}
			}
		});
	},
};