jin.v.reportCategoryList = {
	actionList:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);

		jin.va({
			action:'bindRecs',
			group:{g:'categories'},
			view:a.view
		},{
			add:function(res){
				jin.va({
					action:'show',
					view:{
						v:a.view.v,
						parent:a.view.parent,
						group:{
							g:'categories',
							id:res.rec.id
						}
					}
				});
			},
			build:function(res){
				for (var i=0;i<res.recs.length;i++){
					console.log('cat rec:',res.recs[i]);
					jin.va({
						action:'show',
						view:{
							v:a.view.v,
							parent:a.view.parent,
							group:{
								g:'categories',
								id:res.recs[i].id
							}
						}
					});
				}
			}
		});
	},
	actionShow:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);

		console.log('show cat:',a);

		jin.va({
			action:'bindRec',
			view:a.view
		},{
			update:function(rec){


				a.rec = rec;
			},
			remove:function(res){
				jin.views.action({
					action:'hide',
					view:a.view
				});
			}
		});

		$el.on('mouseenter',function(){
			if ($el.hasClass('active')) return;
			$el.addClass('selected');
			$('.reportBar.selected').removeClass('selected');
			$('.reportBar[data-category="'+a.view.group.id+'"]').addClass('selected');
		}).on('mouseleave',function(){
			if ($el.hasClass('active')) return;
			$('.reportBar.selected').removeClass('selected');
			$el.removeClass('selected');
		}).on('click',function(){
			if (!$el.hasClass('active')) {
				$('.reportBar.active').removeClass('active');
				$('.reportBar.selected').addClass('active');
				$('.reportCategoryList.active').removeClass('active selected');
				$el.addClass('active');
				$('.reportBar').show();
				$('.reportBar:not(.active)').hide();
				//rebuild score
				jin.va({
					action:'update',
					view:a.view.parent,
					category:a.view.group.id
				});
				return;
			}
			$el.removeClass('active');
			$('.reportBar.active').addClass('selected');
			$('.reportBar').removeClass('active').show();

			jin.va({
				action:'update',
				view:a.view.parent
			});
		});

		a.view.scope.category = a.view.group;

		jin.va({
			action:'list',
			view:{
				v:'reportCategoryHours',
				parent:a.view
			}
		});


		$el.show();
		cb.success(a);
	}
};