/*
---
API
---
handles all api calls
*/
var fs = require('fs');
var jin;
var api = {
	init:function(jinR){
		jin = jinR;
		//include all api calls
		jin.tools.includeDir({
			root:jin.config.paths.root,
			dir:jin.config.paths.api,
			namespace:'a'
		},{});
	},
	/*
	run (fun): runs an api
		scope (obj)
		api (str)
	*/
	run:function(a,cb) {
		if (jin.a[a.api] && jin.a[a.api].run) return jin.a[a.api].run(a,cb); //run api if exists
		cb.fail('api does not exist');
	}
};
exports.e = api;