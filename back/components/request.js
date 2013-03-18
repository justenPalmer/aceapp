/*
-------
REQUEST
-------
listens for and handles all standard http requests
*/
var http = require('http');
var url = require('url');
var qs = require('querystring');
var fs = require('fs');
var path = require('path');
var util = require('util');

//static files
var staticS = require('node-static');
var staticServer = new staticS.Server();

var cookies = require('cookies');

var jin;
var request = {
	init:function(jinR){jin = jinR;},

	/*
	startServer (fun): start a http server to listen to a port
		[port] (number): port to listen to, defaults to 80
		---cb---
		success (fun)
	*/
	startServer:function(a,cb){
		var me = this;
		if (!a.port) a.port = 80;
		http.Server(function(req, res) {
			if (!req.headers) req.headers = {}; //prevents crashes if headers not defined
			me.setScope({req:req,res:res},{
				success:function(a){
					me.route(a, {
						success:function(){},
						fail:function(e){console.log(e);}
					});
				}
			});
		}).listen(a.port);
		cb.success();
	},

	/*
	setScope (fun): sets the scope object
		req (obj)
		res (obj)
		---cb---
		success:(fun): success callback
	*/
	setScope:function(r,cb){
		var me = this;
		var a = {};
		a.scope = {
			request:r
		}
		a.scope.cookies = me.getCookies(a);
		a.scope.client = {ip:me.getIp(a)};
		cb.success(a);
	},

	/*
	getIp (fun): gets an ip address from a request
		scope (obj): req object from node request
		---return---
		ip (str): ip address of client
	*/
	getIp:function(a){
		var ip;
		try {
	    	ip = a.scope.request.req.headers['x-forwarded-for'];
	   }
	   catch (e){}
		if (!ip) ip = a.scope.request.req.connection.remoteAddress;
		return ip;
	},

	/*
	getCookies (fun): gets all cookies from a request
		scope
	*/
	getCookies:function(a){
		return new cookies(a.scope.request.req, a.scope.request.res);
	},

	/*
	route (fun): routes a request to the appropriate handler
		scope (obj)
		---cb---
		success (fun)
		fail (fun)
	*/	
	route:function(a,cb){
		var me = this;

		a.scope.url = url.parse(a.scope.request.req.url, true); //using node url object http://nodejs.org/docs/latest/api/url.html
		a.page = a.scope.url.pathname.substr(1);
		a.base = me.getBase(a);

		//performs a route request when called
		cb.route = function(a,cb){
			console.log('page:',a.page);
			if (jin.api && a.page.indexOf('api/') == 0) return me.routeApi(a,cb);
			if (a.page.indexOf('socket.js') !== -1) return me.routeSocket(a,cb);
			if (jin.compress && jin.config.compress && jin.config.compress[a.page] && !jin.config.compress[a.page].once) return me.routeCompress(a,cb);
			//if (a.scope.url.query.length > 0) me.routeDynamic(a,cb);
			me.routeStatic(a,cb);
		};

		if (jin.config.paths.restrict) return me.routeRestrict(a,cb);
		cb.route(a,cb);
	},

	/*
	getBase (fun): retrieves the base of the request and attaches it to a
		--return---
		(str)
	*/
	getBase:function(a){
		if (jin.config.paths.agents) {
			//agent map {device:regular expression}
			var agentMap = {
				iphone:/iPhone/,
				ipad:/iPad/,
				android:/Android/
			};
			for (var i in agentMap) {
				if (jin.config.paths.agents[i] && agentMap[i].test(a.scope.request.req.headers['user-agent'])) {
					return jin.config.paths.agents[i];
				}
			}
			return jin.config.paths.agents['default'];
		}
		return 'front/';
	},

	/*
	routeRestrict (fun): routes requests if the restricted system is active
		scope
	*/
	routeRestrict:function(a,cb){
		var me = this;
		var rest = jin.config.paths.restrict;
		for (var i in rest) {
			console.log('rest:',i,a.page);
			if (a.page.indexOf(i) === 0) {
				me.startSession(a,{
					success:function(a){
						jin.groups.action(jin.tools.morph({
							target:rest[i],
							clone:true,
							merge:{
								group:{g:rest[i].group},
								scope:a.scope
							}
						}),{
							success:function(res){
								console.log('route restrict success:');
								cb.route(a,cb);
							},
							fail:function(res){
								a.scope.request.res.writeHead(302, {
  									'Location': '/'+rest[i].redirect
								});
								a.scope.request.res.end();
							}
						});
					}
				});
				return;
			}
		}
		cb.route(a,cb);
	},

	/*
	routeSocket (fun): routes socket request
		scope
	*/
	routeSocket:function(a,cb){
		var prepend = "var socketPath = 'http://"+jin.config.ip+":"+jin.config.ports[jin.config.env].socket+"';";
		fs.readFile(a.base+a.page, 'utf-8', function (err, content) {
			if (err) return cb.fail('file not found');
			content = prepend+content;
			a.scope.request.res.writeHead(200, {'Content-Type': 'text/javascript'});
			a.scope.request.res.end(content);
			cb.success();
		});
	},

	/*
	routeApi (fun): routes all api requests
		scope
	*/
	routeApi:function(a,cb){
		var me = this;
		me.parse(a,{
			success:function(res){
				me.startSession(a,{
					success:function(a){
						a.api = a.page.replace(/api\//, ''); //take off api folder to get api
						//add data to a
						a = jin.tools.morph({target:res.data,merge:a});
						jin.api.run(a,{
							success:function(res){
								res.success=true;
								a.scope.request.res.writeHead(200, {'Content-Type': 'text/html'});
								a.scope.request.res.end(jin.tools.morph({target:res,freeze:true}));
							},
							fail:function(res){
								res.success=false;
								a.scope.request.res.writeHead(200, {'Content-Type': 'text/html'});
								a.scope.request.res.end(jin.tools.morph({target:res,freeze:true}));
							}
						});
					},
					fail:function(e){cb.fail(e);}
				});	
			},
			fail:function(e){cb.fail(e)}
		});
	},

	/*
	routeCompress (fun): compressed file requests (composed of request folder contents)
		scope
	*/
	routeCompress:function(a,cb){
		//console.log('compress ind:',ind);
		var c = jin.config.compress[a.page];
		if (jin.config.env == 'live') jin.config.compress[a.page].once = true;

		var compress = {
			destination:a.base+c.destination,
			ext:c.ext,
			exclude:c.exclude,
			order:c.order
		};

		if (c.dirs){
			compress.dirs = [];
			for (var i=0,len=c.dirs.length;i<len;i++){
				compress.dirs[i] = jin.tools.morph({target:c.dirs[i],clone:true});
				compress.dirs[i].dir = a.base+c.dirs[i].dir;
			}
		}
		else if (c.dir){
			compress.dir = a.base+c.dir;
		}

		jin.compress.dirToFile(compress, {
			success:function(res){
				var cType = 'text/plain';
				switch (c.ext){
					case 'js':
						cType = 'text/javascript';
						break;
					case 'html':
						cType = 'text/html';
						break;
				}
				a.scope.request.res.writeHead(200, {'Content-Type': cType});
				a.scope.request.res.end(res.output);
			},
			fail:function(res){
				console.log('compress failed:',res);
				a.scope.request.res.writeHead(404, {'Content-Type': 'text/plain'});
				a.scope.request.res.end('file not found');
			}
		});
	},

	/*
	routeDynamic (fun): routes a dynamic (GET) request
		scope
		page
	*/
	routeDynamic:function(a,cb){

	},

	/*
	routeStatic (fun): routes all static files
		scope
		page
	*/
	routeStatic:function(a,cb){
		//add index.html to call
		if (a.page.charAt(a.page.length-1) == '/' || a.page.length < 1) a.page += 'index.html';
		if (a.page.indexOf('.') === -1) a.page += '.html';

		console.log('static:',a.page);

		a.scope.request.req.url = a.base+a.page; //add front to requests
		console.log('static url:',a.scope.request.req.url);
		return staticServer.serve(a.scope.request.req, a.scope.request.res, function (err, r) {
	      if (err && (err.status === 404)) { // If the file wasn't found
				a.scope.request.res.writeHead(404, {'Content-Type': 'text/plain'});
				a.scope.request.res.end('file not found');
				return cb.fail(err);
	      }
	      return cb.success();
	   });
	},

	/*
	parse (fun): separates a request page from its data
		scope (obj)
		---cb---
		success (fun)
			page
			data
		fail (fun)
	*/
	parse:function(a,cb){
		var req = a.scope.request.req;
		var res = {page:a.scope.url.pathname};
		//console.log('method:',req.method,req.headers['content-type']);

		if (req.method == 'POST' && (!req.headers['content-type'] || req.headers['content-type'].indexOf('multipart') === -1)) { //POST, but not upload
    		var post = '';
	    	req.on('data', function(p){
	    		//console.log('post piece:',p);
	    		post += p;
	    	});
	    	req.on('end', function(){
				var data = qs.parse(post);
				//console.log('post data:',data);
				if (data.escape) { //if escape attribute is defined
					try{
						data = jin.tools.morph({thaw:unescape(data.escape),merge:data});
					}
					catch(e){
						return cb.fail('request parse: escape format invalid');
					}
				}
				res.data = jin.tools.morph({target:a.scope.url.query,merge:data}); //merges JSON objects into one
				if (!res.data) res.data = {};
				cb.success(res);
	      });
	      return;
		}
		//GET or upload
		res.data = (a.scope.url.query)? a.scope.url.query: {};
		if (res.data.escape) {
			try{
				res.data = JSON.parse(unescape(res.data.escape));
			}
			catch(e){
				return cb.fail('request parse: escape format invalid');
			}
		}
		cb.success(res);
	},

	/*
	startSession (fun): starts a session with the client
		scope (obj)
		---cb---
		success (fun)
		fail (fun)
	*/
	startSession:function(a,cb){
		var me = this;
		a.sessId = a.scope.cookies.get('jinSessId');
		if (!a.sessId) {
			//create random session id
			a.sessId = jin.tools.hash({random:true}); //incorporate timestamp
			//set session
			a.scope.cookies.set('jinSessId', /*a.sessId*/'server val', {path:'/'});
		}
		jin.session.start(a,cb);
	},

	/*
	get (fun): retrieves a page
		href (str): path to page to open
		---cb---
		success (fun)
			req (str): data from the page opened
	*/
	get:function(a,cb){
		cb = cb || {};
		if (!cb.success) cb.success = function(){};
		if (!cb.fail) cb.fail = function(res){console.log(res)};

		if (!a.href) return false;
		
		var urlObj = url.parse(a.href);
		
		//console.log('url obj:'+JSON.stringify(urlObj));
		
		var options = {
		  host: urlObj.host,
		  port: 80,
		  path: urlObj.pathname+'?'+urlObj.query
		};

		//console.log('path:'+domain+options.path);
		http.get(options, function(res) {
			//console.log("Got response: " + res.statusCode);
			res.setEncoding('utf8');

			var reqData = '';
			res.on('data', function (chunk) {
		    //console.log('BODY: ' + chunk);
				reqData += chunk;
		 	});
			res.on('end', function(){
				cb.success(reqData);
			});
		}).on('error', function(e) {
			cb.fail('get request error:',e.message);
		});
	},
};
exports.e = request;
