jin.v.me = {
	actionShow:function(a,cb){
		var me = this;
		a.$place = a.view.parent.$el.find('.container');
		a.position = 'html';
		var $el = jin.views.get$el(a);
		$el.show();

		jin.views.action({
			action:'active',
			active:a.view.path,
			view:{path:'home/topBar/topNav'}
		});

		var userId = jin.session.get('userId');
		a.view.scope.userId = userId;

		jin.views.action({
			action:'bindRec',
			view:a.view,
			group:{g:'users',id:userId}
		},{
			update:function(user){
				console.log('user:',user);
				var name = '';
				if (user.fName) name += user.fName;
				if (user.lName) name += ' '+user.lName;
				if (name.length < 1) name = user.username;
				$el.find('[data-prop="name"]').html(name);
				if (user.phone) $el.find('[data-prop="phoneDisp"]').html(jin.tools.format({target:user.phone,phone:'usa'}));
				$changePassForm.hide();
				$changePassBtn.show();
			}
		});

		$el.on('focusout', 'input', function(){
			var $field = $(this);
			var prop = $field.attr('data-prop');
			var val = $field.val();

			if (val.length < 1) return;

			var update = {
				group:{g:'users',id:userId},
				action:'update'
			};
			update[prop] = val;
			jin.groups.action(update,{
				success:function(res){
					$el.find('.error').hide();
					console.log('update success:',res);
				},
				fail:function(res){
					console.log('update fail:',res);
					$el.find('.error').show().html(res.error);
				}
			});
		});

		//enter input submit
		$el.on('keydown', 'input', function(e){
			if (e.keyCode == 13) {
				$(this).blur();
			}
		});

		var $detailsEdit = $el.find('.detailsEdit');
		var $detailsDisp = $el.find('.detailsDisp');
		$detailsEdit.hide();

		$el.on('click','.btnEdit',function(){
			$detailsEdit.show();
			$detailsDisp.hide();
		});
		$el.on('click','.btnDone',function(){
			$detailsEdit.hide();
			$detailsDisp.show();
		});

		var $changePassBtn = $el.find('.btnChangePass');
		var $changePassForm = $el.find('.changePassForm');
		$changePassForm.hide();
		$changePassBtn.show();

		$el.on('click','.btnChangePass',function(){
			$changePassForm.show();
			$changePassBtn.hide();
		});

		var weekTs = jin.g.weeks.get();
		jin.groups.action({
			group:{
				g:'taskTotals',
				find:{
					week:weekTs,
					userId:a.view.scope.userId
				}
			},
			key:a.view.path,
			action:'getRecs'
		},{
			success:function(recs){
				console.log('total task recs:',recs);
				var total = recs[0];
				jin.views.action({
					action:'bindRec',
					view:a.view,
					group:{
						g:'taskTotals',
						id:total.id
					},
					noWrite:true
				},{
					update:function(rec){
						//console.log('update total rec:',recs);
						$el.find('[data-prop="tangible"]').html(rec.tangible);
						$el.find('[data-prop="total"]').html(rec.total);
						a.total = rec.total;
						a.tangible = rec.tangible;
						me.actionUpdate(a);	
					}
				});
			},
			fail:function(res){
				console.log('get task recs fail:',res);
			}
		});

		$el.on('click','.viewTasks',function(){
			jin.views.go({
				view:{
					v:'ace',
					group:{g:'users',id:a.view.scope.userId},
					parent:a.view.scope.home
				}
			});
		});



		cb.success(a);
	},

	actionUpdate:function(a,cb){
		var me = this;
		var $el = jin.views.get$el(a);
		var minHours = 4;
		var maxHours = 40;

		var tanBar = me.getBarSize(a.tangible);
		var totBar = me.getBarSize(a.total);

		$el.find('.bar.tanBar').css({width:tanBar.w+'%'}).removeClass('low med high extreme').addClass(tanBar.cl);
		$el.find('.bar.totBar').css({width:totBar.w+'%'}).removeClass('low med high extreme');
		$el.find('[data-prop="tangibleHours"]').html(a.tangible);
		$el.find('[data-prop="totalHours"]').html(a.total);
	},

	getBarSize:function(hours){
		if (hours < 4){
			var w = (hours/4)*25;
			var cl = 'low';
		}
		else if (hours < 12){
			var w = (hours/12)*25+25;
			var cl = 'med';
		}
		else if (hours < 40){
			var w = (hours/40)*25+50;
			var cl = 'high';
		}
		else {
			var w = (hours/120)*25+75;
			var cl = 'extreme';
		}
		return {w:w,cl:cl};
	}
};