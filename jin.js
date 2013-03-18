
/*
----------
JIN CONFIG
----------
Jin supports multiple environments.  To have jin auto detect which environment is currently active structure your project as follows:
	-project folder
		-dev
			-core.js
		-stage
			-core.js
		-live
			-core.js

*/

var jin = {
	config:{
		env:false, //if false, auto detect environment
		ignoreErr:false, //if true, keeps errors from crashing server
		domain:'204.236.237.241',
		//ip:'204.236.237.241',
		ip:'localhost',
		paths:{ //file paths - with trailing '/'
			root:__dirname+'/',
			agents:{
				iphone:'front/default/',
				ipad:'front/default/',
				android:'front/default/',
				'default':'front/default/'
			},
			components:'back/components/',
			api:'back/api/',
			groups:'back/groups/'
			/*,
			restrict:{ //restricts file and directory access
				'dashboard/':{
					group:'users',
					action:'reqRestrict',
					allow:['admin', 'superAdmin', 'intake'],
					redirect:'restrict.html'
				}
			}
			*/
		},
		ports:{
			dev:{request:8080,socket:8081},
			stage:{request:8090,socket:8091},
			live:{request:80,socket:81},
			'default':{request:8090,socket:8091}
		},
		npm:{ //node package manager dependencies
			mods:['cookies','node-static','socket.io','mongodb','mailer']
		},
		compress:{
			run:true,
			'js/compress.js':{
				destination:'js/compress.js',
				dir:'js/',
				ext:'js', 
				exclude:['socket.js'],
				order:['plugins','jquery.js','jin.js','components','groups','views']
			},
			'views/compress.html':{
				destination:'views/compress.html',
				dir:'views/',
				ext:'html', 
				exclude:[]
			}
		},
		query:{
			component:'mongo',
			mongo:{
				db:'oc',
				ip:'localhost',
				port:27017
			}
		},
		mail:{
			username:'hello@mail.com',
			password:'password',
			host:'smtp.mail.com',
			port:587
		},
		cron:true
	}
};

if (!jin.config.env) { //if no environment set
	var envs = ['dev', 'stage', 'live']
	for (i=0,len=envs.length;i<len;i++) {
		if (jin.config.paths.root.indexOf('/'+envs[i]) != -1) { //if core is in the tested env folder
			jin.config.env = envs[i]; //set active env
			break;
		}
	}
	if (!jin.config.env) jin.config.env = 'default'; //env not found, set to default
}

if (jin.config.ignoreErr) process.on('uncaughtException',function(err){console.log('err:'+err);});

jin.config.timezoneOffset = -Number(new Date().getTimezoneOffset())/60;

console.log('timezone offset:',jin.config.timezoneOffset);

/*
---------------------
INITIALIZE COMPONENTS
---------------------
*/

//include tools
var exp = require(jin.config.paths.root+jin.config.paths.components+'tools.js');
jin.tools = exp.e;
jin.tools.init(jin);

//include components
jin.tools.includeDir({
	root:jin.config.paths.root,
	dir:jin.config.paths.components, 
	order:['query.js','mongo.js'],
	exclude:['tools.js']
},{
	success:function(){ //jin is initialized
		var port = jin.config.ports[jin.config.env].request; //get port associated with env
		jin.request.startServer({
			port:port
		},{
			success:function(){
				console.log('server started');
			}
		});

		var sockPort = jin.config.ports[jin.config.env].socket; //get port associated with env
		jin.socket.startServer({
			port:sockPort
		},{
			success:function(){
				console.log('socket server started');
			}
		});
	}
});

