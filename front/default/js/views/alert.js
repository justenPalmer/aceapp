/*
---------
v|alert
---------
Input field auto-complete view
*/
jin.v.alert = {

	/*
	actionShow (fun): shows the decision box
		---a---
		alert (str): the message to show
		type (str): 'success', 'warning', 'error', 'info'
		buttons (ary): ary of button objects to show and their respective callbacks
			{label:'confirm',class:'confirm',type:'warning',cb:function(){}}
		fadeOut (num): number of milliseconds to wait until alert fades out
		overlay (bool): if true, overlay appears
	*/
	actionShow:function(a,cb){
		var me = this;
		a.$place = $('body');
		a.position = 'append';
		var $el = jin.views.get$el(a);
		$el.find('.btnBox').hide().html('');

		if (!me.$overlay) {
			me.$overlay = $(document.createElement('div'));
			me.$overlay.css({
				display:'none',
				top:'0px',
				bottom:'0px',
				left:'0px',
				right:'0px',
				position:'fixed',
				zIndex:1000,
				backgroundColor:'#000',
				opacity:'0.7'
			}).on('click',function(){
				me.$overlay.hide();
				jin.va({
					view:a.view,
					action:'hide'
				});
			});
			$('body').append(me.$overlay);
		}

		if (me.timer) clearTimeout(me.timer);

		if (a.alert){
			if (a.type) $el.find('.outer').removeClass('alert-warning alert-success alert-error alert-info').addClass('alert-'+a.type);
			$el.find('.alertMessage').html(a.alert);
			if (a.buttons){
				for (var i=0,len=a.buttons.length;i<len;i++){
					var btn = a.buttons[i];
					var $btn = $('<span></span>');
					if (btn.label) $btn.html(btn.label);
					if (btn.class) $btn.addClass(btn.class);
					$btn.addClass('btn btn-large');
					if (btn.type) $btn.addClass('btn-'+btn.type);
					$btn.addClass('btn'+i);
					$el.find('.btnBox').append($btn);
					var btnClick = function(cb){
						$el.on('click','.btn'+i,function(){
							me.$overlay.hide();
							jin.views.action({
								view:a.view,
								action:'hide'
							});
							if (cb) cb();
						});
					}
					btnClick(btn.cb);
				}
				$el.find('.btnBox').show();
			}
			if (a.fadeOut){
				me.timer = setTimeout(function(){
					$el.fadeOut(400,function(){
						 me.$overlay.hide();
						jin.views.action({
							view:a.view,
							action:'hide'
						});
					});
				},a.fadeOut);
			}

			$el.show();
			if (a.overlay) me.$overlay.show();
		}

		cb.success(a);
	}
};