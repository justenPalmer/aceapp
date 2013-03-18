/*
-----
VIEWS
-----
Handles all views
*/
jin.views = {
	/*
	init (fun): hide and init all views, init auth and start views on completion
	*/
	init:function(){
		var me = this;

		//console.log('views init');
		//import in views
		var $templates = $('<div id="templates" style="display:none;"></div>');
		$('body').append($templates);

		//console.log('view include:',jin.config.views.include);

		jin.tools.loop({
			ary:jin.config.views.include
		},{
			loop:function(loop){
				$.get(jin.config.views.include[loop.i], function(res){
					$templates.append($(res));
					loop.next();
				});
			},
			success:function(){
				for (var v in jin.v){
					if (jin.v[v].init) jin.v[v].init();
				}
				
				me.refs = {patterns:{}};
				//store templates
				$('#templates [data-v]').each(function(){
					var v = $(this).attr('data-v');
					if (!jin.v[v]) jin.v[v] = {};
					me.refs.patterns[v] = $(this).detach();
				});

				socket.ready(function(){
					console.log('socket ready');
					me.initHash();
				});
			}
		});

		/*
		$.get('views/compress.html', function(res){
			var $templates = $('<div id="templates" style="display:none;">'+res+'</div>');
			$('body').append($templates);
			//init all views
			
			
		});
		*/
	},
	/*
	initHash (function): binds hashchange events to views
	*/
	initHash:function() {
		var me = this;
		$(window).hashchange(function(){
			me.showPath({path:window.location.hash}, {
				success:function(path){
					//console.log('view show complete:',path);
				},
				fail:function(res){
					console.log('view show failed:', res);
				}
			});
		});
		$(window).hashchange();
	},
	/*
	go (function): loads a path and sets url
		view

	*/
	go:function(a, cb){
		console.log('view go 1:',a);
		var me = this;
		me.setupView(a,{
			success:function(a){
				console.log('view go:',a.view);
				loc = '#!'+a.view.path;
				window.location = loc;
			}
		});
	},
	/*
	showPath (function): shows a view path
		a
			path (string)
	*/
	showPath:function(a, callbacks){
		var me = this;
		if (!a.path) a.path = '';
		//hide prev path difference
		a.path = a.path.replace(/[\#\!]+/, '');
		//console.log('showPath init:',path);
		if (!a.path || a.path.length < 1) return jin.go('#!'+jin.config.views['default'], callbacks);

		//step 1 compare paths
		me.comparePaths(a, {
			success:function(res){
				me.prevPath = a.path;
				//step 2 hide prev
				res.hide.reverse();
				me.hidePaths(res.hide, {
					success:function(){
						//step 3 show cur
						me.showPaths(res.show, callbacks);
					},
					fail:function(res){callbacks.fail(res);}
				});	
			},
			fail:function(res){callbacks.fail(res);}
		});
	},

	/*
	comparePaths (function): 
		a
			path
	*/
	comparePaths:function(a, callbacks){
		var me = this;
		if (!me.prevPath || a.refresh) me.prevPath = '';
		if (me.prevPath == a.path) return callbacks.fail('view already shown');
		//start from base and compare strings
		var viewActions = me.recCompare({
			path:a.path,
			prevPath:me.prevPath
		},callbacks);
	},

	/*
	recCompare (function):
		a
			path
			prevPath
	*/
	recCompare:function(a, callbacks){
		if (!a.root) a.root = '';
		if (!a.prevRoot) a.prevRoot = '';
		if (!a.viewActions) a.viewActions = {hide:[],show:[]};
		//look for next /
		var pathI = a.path.indexOf('/');
		var prevI = a.prevPath.indexOf('/');

		var chunk = (pathI !== -1)? a.path.substr(0,pathI): a.path;
		var prevChunk = (prevI !== -1)? a.prevPath.substr(0,prevI): a.prevPath;

		a.path = (pathI !== -1)? a.path.substr(pathI+1): '';
		a.prevPath = (prevI !== -1)? a.prevPath.substr(prevI+1): '';
		if (chunk != prevChunk || a.isChanged) { //paths do not match
			a.isChanged = true;
			if (prevChunk.length > 0 && a.viewActions.hide.length < 1) a.viewActions.hide.push(a.prevRoot+prevChunk);
			if (chunk.length > 0) a.viewActions.show.push(a.root+chunk);
		}

		//console.log('chunk:',chunk,' prevChunk:',prevChunk);
		if (a.path.length < 1 && a.prevPath.length < 1) return callbacks.success(a.viewActions); //escape if no chunks left
		
		a.prevRoot += prevChunk+'/';
		a.root += chunk+'/';
		this.recCompare(a, callbacks);
	},

	/*
	hidePaths (fun): hides an array of paths
		paths (ary)
	*/
	hidePaths:function(paths, callbacks){
		//console.log('hide paths:', paths);
		var me = this;
		jin.tools.loop({
			ary:paths
		},{
			loop:function(loop){
				me.action({
					action:'hide',
					view:{path:paths[loop.i]}
				},{
					success:function(){loop.next();},
					fail:function(){loop.next()}
				});
			},
			success:function(){
				callbacks.success();
			}
		});
	},

	/*
	showPaths (fun): shows an array of paths
		paths (ary)
	*/
	showPaths:function(paths, callbacks){
		//console.log('show paths:', paths);
		var me = this;
		jin.tools.loop({
			ary:paths
		},{
			loop:function(loop){
				me.action({
					action:'show',
					view:{path:paths[loop.i]}
				},{
					success:function(){loop.next();},
					fail:function(){loop.next();}
				});
			},
			success:function(){
				callbacks.success();
			},
			fail:function(res){
				callbacks.fail(res);
			}
		});
	},

	/*
	setupView (fun): sets up the view data for an action
		view
			path (str): defines parameteres of view in a single string - unique to each group
			v (str): view pattern - required for each group
	*/
	setupView:function(a,cb){
		//console.log('setup path parent:',a.view.parent);
		var me = this;
		me.setupFromPath(a, {
			success:function(a){
				me.setupParent(a);
				me.setupScope(a);
				me.setupPath(a);
				me.setupRef(a);
				me.setupChildren(a);
				me.setupJin(a);
				cb.success(a);
			}
		});
	},

	/*
	setupFromPath (fun)
		view
		---cb---
		success
	*/
	setupFromPath:function(a,cb){
		var me = this;
		if (typeof a.view == 'string') a.view = {path:a.view};

		if (!a.view.path) return cb.success(a);
		
		var ind = a.view.path.lastIndexOf('/');
		var parentPath = a.view.path.substr(0,ind);
		var viewStr = a.view.path.substr(ind+1);
		var viewAry = viewStr.split('?');
		a.view.v = viewAry[0]; //view
		if (viewAry[1]) a.view = jin.tools.morph({unweb:viewAry[1],merge:a.view});

		//console.log('parent:',a.view.parent);
		if (!a.view.parent && parentPath && parentPath.length > 0) {
			return me.setupView({view:parentPath},{
				success:function(pa){
					a.view.parent = pa.view;
					cb.success(a);
				}
			});
		}
		cb.success(a);
	},

	/*
	setupParent (fun)
		view
	*/
	setupParent:function(a){
		if (!a.view.parent) a.view.parent = {path:'',$el:$('body'),scope:{}};
	},

	/*
	setupScope (fun): sets up the scope property which gets passed down to each child view
		view
	*/
	setupScope:function(a){
		if (!a.view.scope) a.view.scope = {};
		if (a.view.parent) {
			a.view.scope = (a.view.scope)? jin.tools.morph({target:a.view.parent.scope,merge:a.view.scope,clone:true}): a.view.parent.scope;
		}
	},

	/*
	setupPath (fun)
		view
	*/
	setupPath:function(a){
		if (a.view.path) return;
		a.view.path = (a.view.parent.path == '')? a.view.v: a.view.parent.path+'/'+a.view.v;
		var viewData = jin.tools.morph({target:a.view,clone:true,shrink:['v','_jin','parent','childen','$el','path','scope','group']}); //remove properties that don't add to the view path
		if (a.view.group) {
			//console.log('setup group:',a.view.group);
			jin.groups.setupPath(a.view);
			viewData.group = a.view.group.path;
		}
		viewData = jin.tools.morph({target:viewData,web:true});
		a.view.path = (viewData)? a.view.path+viewData: a.view.path;
	},

	/*
	setupRef (fun): sets up the global reference to the group
		view
	*/
	setupRef:function(a){
		var me = this;
		if (!me.refs) me.refs = {};
		if (!a.view.v) return callbacks.fail('view err: no v defined ',a.view);
		if (!me.refs[a.view.v]) me.refs[a.view.v] = {paths:{}};
		if (!me.refs[a.view.v].paths[a.view.path]) me.refs[a.view.v].paths[a.view.path] = a.view;
		a.view = me.refs[a.view.v].paths[a.view.path];
	},

	/*
	setupChildren (fun): sets up the children refs of this view
		view
	*/
	setupChildren:function(a){
		if (!a.view.parent.children) a.view.parent.children = [];
		//console.log('set child:', a.view, a.view.parent);
		if (a.view.parent.children.indexOf(a.view) === -1) a.view.parent.children.push(a.view);
	},

	/*
	setupJin (fun): sets up the _jin property
		view
	*/
	setupJin:function(a,cb){
		if (!a.view._jin) a.view._jin = {};
	},

	/*
	action (fun): executes view action
		view (obj)
		action (str)
		---cb---
		success (fun)
		fail (fun)
	*/
	action:function(a,cb){
		var me = this;
		//console.log('a.view:',a.view.parent);
		//var view = a.view;
		cb = cb || {};
		if (!cb.success) cb.success = function(){};
		if (!cb.fail) cb.fail = function(res){console.log('view action fail:',res);}
		me.setupView(a, {
			success:function(a){
				var method = 'action'+jin.tools.format({target:a.action,upper:'first'});
				if (jin.v[a.view.v] && jin.v[a.view.v][method]) return jin.v[a.view.v][method](a,cb);
				if (jin.views[method]) return jin.views[method](a,cb);
			},
			fail:function(res){
				console.log('view setup fail:', res);
			}
		});
	},

	/*
	get$el (fun): gets or places an $el jquery object into the DOM
		view
			v
			parent
		$pattern (obj): jquery ref
		$place (obj): jquery ref
		position (str): 'before' or 'after'
		---return---
		($obj): jquery object added
	*/	
	get$el:function(a){
		var me = this;

		//console.log('get $el:',a);
		if (a.view.$el) return a.view.$el;

		var $pattern = a.$pattern || me.get$pattern(a);
		var $place = a.$place || me.get$place(a);
		a.view.$el = $pattern.clone();
		var attrs = {'data-v':a.view.v, 'data-path':a.view.path};

		a.view.$el.attr(attrs).hide().find('[data-place]').hide(); //hides the view (so it can be shown by v)

		a.position = a.position || 'before';
		$place[a.position](a.view.$el);

		return a.view.$el;
	},

	/*
	hide$el (fun): hides an $el
		$el
	*/
	hide$el:function(a){
		if (!a.$el) return console.log('no $el defined');
		jin.views.action({
			action:'hide',
			view:{path:a.$el.attr('data-path')}
		});
	},

		/*
	actionBindRec (fun): binds a view to a group rec
		view (str)
		group (obj)
			g (str)
			[id] (str)
		noWrite (bool): if true, does not write properties into view
		---cb---
		success (fun)
		fail (fun)
		update (fun)
		remove (fun)
	*/
	actionBindRec:function(a,cb){
		var me = this;
		var group = a.group || a.view.group;
		//console.log('bind rec:',a);

		var doProps = function(a,cb){
			if (!a.noWrite) {
				me.actionWriteProps(a,{});
				setTimeout(function(){
					if (cb.update) cb.update(a.rec);
				},1);
				return;
			}
			if (cb.update) cb.update(a.rec);
			return;
		};

		jin.groups.action({
			action:'getRecs',
			group:group,
			key:a.view.path
		},{
			success:function(recs){
				//console.log('bind rec get recs success:',recs,a.view.path);
				a.rec = recs[0];
				doProps(a,cb);
				
				jin.views.actionBindGroup({
					view:a.view,
					group:group
				},{
					update:function(res){
						a.rec = res.rec;
						doProps(a,cb);
					},
					remove:function(res){
						if (cb.remove) cb.remove(res.rec);
					}
				});
				cb.success(a.rec);
			},
			fail:function(res){
				console.log('get recs fail:',res);
				cb.fail(res);
			}
		});
	},

		/*
	actionWriteProps (fun): writes properties into html view based on rec
		rec
		view
	*/
	actionWriteProps:function(a){
		var me = this;
		var $el = me.get$el(a);

		if (!a.rec) return;
		$el.find('[data-prop]').each(function(){ //find a way to not set the views inside props
			jin.views.actionWriteProp({rec:a.rec,view:a.view,$el:$(this),prop:$(this).attr('data-prop')});
		});	
		if ($el.attr('data-prop')) {
			jin.views.actionWriteProp({rec:a.rec,view:a.view,$el:$el,prop:$el.attr('data-prop')});
		}
	},

	/*
	actionWriteProp (fun)
		rec
		view
		$el (obj) element to write prop to
		prop (str) prop to write
	*/
	actionWriteProp:function(a,cb){
		//if (!a.rec[a.prop] || typeof a.rec[a.prop] != 'string') return;
		if (!a.$el) return;
		if (a.$el.is('input') || a.$el.is('select')) {
			a.$el.val(a.rec[a.prop]);
		}
		else if (a.$el.is('img')) {
			a.$el.attr({'src':a.rec[a.prop]});
		}
		else {
			a.$el.html(a.rec[a.prop]);
		}
	},

	/*
	get$pattern (fun)
		view
	*/
	get$pattern:function(a){
		var me = this;
		//console.log('pattern:');
		if (me.refs.patterns[a.view.v]) return me.refs.patterns[a.view.v];
		//console.log('pattern blank');
		return $('<div></div>'); //blank pattern
	},

	/*
	get$place (fun)
		view
	*/
	get$place:function(a){
		var $place;
		//console.log('get $place:',a.view.parent.$el);
		if (a.view.parent.$el && a.view.parent.$el.length > 0) return a.view.parent.$el.find('[data-place="'+a.view.v+'"]');
		return $('body').find('[data-place="'+a.view.v+'"]');
	},

	/*
	actionHide (fun)
		view (obj)
		---cb---
		success (fun)
	*/
	actionHide:function(a,cb){
		//console.log('hide:',a.view.path);
		var me = this;
		if (a.view.path == '') return cb.success(a);

		var $el = me.get$el(a);
		$el.hide();

		if (!me.refs[a.view.v].paths[a.view.path]) {
			return cb.success(a);
		}
		me.hideChildren(a,{
			success:function(){
				if (a.view.$el) a.view.$el.off().hide().remove();
				delete a.view.$el;

				if (a.view.parent && a.view.parent.children) {
					var ind = a.view.parent.children.indexOf(a.view);
					//a.view.parent.children.splice(ind,1);
				}

				me.action({
					action:'unbindGroup',
					view:a.view
				});

				if (me.refs[a.view.v].paths[a.view.path]) delete me.refs[a.view.v].paths[a.view.path];
				cb.success(a);
			}
		});
	},

	/*
	hideChildren (fun)
		view (obj)
		---cb---
		success (fun)
	*/
	hideChildren:function(a,cb){
		if (a.view.children) {
			//console.log('hide children:',view.children.length);
			var children = a.view.children;
			jin.tools.loop({
				ary:children
			},{
				loop:function(loop){
					//console.log('hide loop i:',loop.i);
					if (children[loop.i] && children[loop.i].path != a.view.path) { //prevents infinite looping
						//console.log('hide:',children[loop.i]);
						return jin.views.action({
							action:'hide',
							view:children[loop.i]
						},{
							success:function(){
								loop.next();
							},
							fail:function(){
								loop.next();
							}
						});
					}
					loop.next();
				},
				success:function(){
					setTimeout(function(){
						a.view.children = [];
						cb.success();
					}, 1);
				}	
			});
		}
		else {
			setTimeout(function(){
				cb.success();
			},1);
		}
	},

	/*
	actionBindGroup (fun): binds a view to a group
		view
		group
	*/
	actionBindGroup:function(a,cb){
		//console.log('bindGroup:',a);
		if (!a.view._jin.boundGroups) a.view._jin.boundGroups = [];
		var group = a.group || a.view.group;
		if (a.view._jin.boundGroups.indexOf(group) == -1) a.view._jin.boundGroups.push(group);
		
		//console.log('bound group:',a.view._jin);

		var aO = {
			group:group,
			action:'bind',
			key:a.view.path
		};
		
		jin.groups.action(aO,cb);
	},


	/*
	actionUnbindGroup (fun): unbinds group events from a view
		view
		group
	*/
	actionUnbindGroup:function(a,cb){
		//console.log('unbind group:',a.view._jin);
		if (a.view._jin.boundGroups) {
			var groups = a.view._jin.boundGroups;
			for (var i=0,len=groups.length;i<len;i++){
				//console.log('unbind group:',a.view.path,groups[i]);
				jin.groups.action({
					action:'unbind',
					group:groups[i],
					key:a.view.path
				});
			}
		}
	},

	/*
	isPath (fun): checks if the args are in the current path
		v (str)
	*/
	isPath:function(a){
		var me = this;
		console.log('prev path:',me.prevPath);
		if (a.v) {
			if (me.prevPath.indexOf(a.v) != -1) return true;
			return false
		}
	},

	/*
	actionDefaultView (fun): sets a view as the default view, mostly fixes a path problem
		view (obj)
	*/
	actionDefaultView:function(a,cb){
		var me = this;
		var view = a.view;
		
		if (view.parent.path == me.prevPath)
		jin.views.action({
			action:'show',
			view:a.view
		},{
			success:function(){
				console.log('prev path set:',view.path);
				me.prevPath = view.path;
			}
		});
	},

	/*
	actionBindRecs (fun): binds a view to a groups recs
		---a---
		view (obj)
		group (obj)
		---cb---
		add (fun)
			---res---
			rec (obj): record added
		build (fun)
			---res---
			recs (ary): ary of objects
	*/
	actionBindRecs:function(a,cb){
		jin.views.action({
			view:a.view,
			action:'bindGroup',
			group:a.group
		},{
			add:function(res){
				if (cb.add) cb.add(res);
			}
		});

		jin.groups.action({
			group:a.group,
			key:a.view.path,
			action:'getRecs'
		},{
			success:function(recs){
				//console.log('task recs:',recs);
				if (cb.build) cb.build({recs:recs});
			},
			fail:function(res){
				console.log('get recs fail:',res);
			}
		});
	}

};