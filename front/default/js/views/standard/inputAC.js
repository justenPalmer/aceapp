/*
----------
v|inputAC
----------
Input field auto-complete view
*/
jin.v.inputAC = {
	/*
	actionShow (fun)
		---a---
		$input (obj): the input field that controls the dropdown
		$container (obj): the dropdown div where the items will be placed (items will be placed in spans)
		group
		recs (ary): array of recs to populate
		---cb---
		row
			---res---
			$row
			rec
		select
			---res---
			$row
			rec
		check
			---res---
			val
			rec
			---return---
			(bool)
		blur
			---res---
			$input
			val
	*/
	actionShow:function(a,cb){
		var me = this;
		var view = a.view;
		var $container = a.$container;
		var $input = a.$input;

		var shown;
		var prevVal;
		var $selected;

		$container.hide();
		
		//on mouseenter of a selection, set it as active
		$container.on('mouseenter', 'span', function(){
			$selected = $(this);
			$container.children('.selected').removeClass('selected');
			$selected.addClass('selected');
		});
		
		//task autocomplete
		$input.on('focusin keyup', function(e){

			console.log('key pressed:',$selected);
			//$input.select();
			//dropdown hide
			if (!shown) {
				//off click close
				$container.on('click', function(){
					return false;
				});
				$input.on('click', function(){
					return false;
				});
				$(document).one('click', function(e){
					$container.hide();
					shown = false;
				});
				$container.show();
				shown = true;
			}
			
			//key pressed
			//console.log('key pressed:',$selected);
			if (e.which) {
				switch (e.which) {
					case 40: //down
						if ($selected) {
							$selected = $selected.removeClass('selected').next();
						} 
						if (!$selected || !$selected.length) $selected = $container.children('span').first();
						$selected.addClass('selected');
						return;
					case 38: //up
						if ($selected && $selected != $container.first()) {
							$selected = $selected.removeClass('selected').prev();
						} 
						if ($selected && !$selected.length) $selected = $container.children('span').last();
						$selected.addClass('selected');
						return;
					case 13: //enter
						console.log('enter pressed');
						if ($selected) { //is selected
							$container.hide();
							$(document).off('click');
							shown = false;

							cb.select({$row:$selected,rec:$selected.data('rec'),$input:a.$input});
							return;
						}
				}
			}

			//console.log('input ac:',a.group);
			
			var val = jin.tools.format({target:$input.val(),trim:'spaces',lower:'all'})

			$container.show();
			
			if (val != prevVal) {
				//remove prev list
				$container.children().remove();
				prevVal = val;
				//get list to populate
				if (a.recs) {
					for (var i=0,len=a.recs.length;i<len;i++){
						if (cb.check({val:val,rec:a.recs[i]})) {
							var $row = $(document.createElement('span'));
							if (cb.row) cb.row({$row:$row,rec:a.recs[i],i:i});
							$container.append($row);
							$row.data('rec',a.recs[i]);
						}
					}
					return false;
				}

				//get recs for group
				jin.groups.action({
					group:a.group,
					action:'getRecs',
					key:a.view.path
				},{
					success:function(recs){
						//console.log('dropdown recs:',recs);
						for (var i=0,len=recs.length;i<len;i++){
							if (cb.check({val:val,rec:recs[i]})) {
								var $row = $(document.createElement('span'));
								if (cb.row) cb.row({$row:$row,rec:recs[i],i:i});
								$container.append($row);
								$row.data('rec',recs[i]);
							}
						}
					}
				});
			}
			return;// false;
		});
		
		$input.on('blur',function(){
			setTimeout(function(){
				if (!clicked && cb.blur) cb.blur({$input:$input,val:$input.val()});
			},200);
		});


		var clicked;
		
		//autocomplete click
		$container.on('click', 'span', function(){
			clicked = true;
			console.log('dropdown clicked');
			$selected = $(this);

			$container.hide();
			$(document).off('click');
			shown = false;

			cb.select({$row:$selected,rec:$selected.data('rec'),$input:a.$input});
			return false;
		});

		cb.success(a);
	}
};