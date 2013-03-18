jin.v.reportBar = {
	/*
		actionList (fun): lists caregiver rows for setup
			search (str)
	*/
	actionList:function(a,cb){
		var me = this;
		var view = a.view;

		if (!a.search) a.search = '';

		var group = {
			g:'tasks',
			find:{week:a.view.scope.week},
			sort:{category:1}
		};

		var maxRows = 30;
		var curRow = 0;

		var addRow = function(rec){
			jin.va({
				action:'show',
				view:{v:a.view.v,parent:a.view.parent,group:{g:'tasks',id:rec.id}}
			});
		};

		//hide all rows
		jin.groups.action({group:group,action:'getRecs',key:a.view.path,reset:true},{
			success:function(recs){
				//console.log('getRecs:',recs);
				if (!recs || recs.length < 1) return;
				
				for (var i=0,len=recs.length;i<len;i++){
					addRow(recs[i]);
				}
			},
			fail:function(res){
				console.log('get recs fail:',res);
			}
		});
		
		//bind to group
		jin.views.action({
			view:view,
			action:'bindGroup',
			group:group
		},{
			add:function(res){
				//console.log('addView:',res);
				addRow(res.rec);
			}
		});

		//hide all rows
		jin.groups.action({group:group,action:'getRecs',key:a.view.path},{
			success:function(recs){
				//console.log('getRecs:',recs);
				if (!recs || recs.length < 1) return;
				
				for (var i=0,len=recs.length;i<len;i++){
					addRow(recs[i]);
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

				$el.attr('data-category',rec.category);

				$el.height(rec.hours);
				$el.attr({'data-tot':rec.hours});

				jin.va({
					action:'update',
					view:a.view.parent
				});
			},
			remove:function(res){
				jin.views.action({
					action:'hide',
					view:a.view
				});
			}
		});

		cb.success(a);
	}
};