/*
-----
QUERY
-----
handles all database queries
*/
var fs = require('fs');
var jin;
var query = {
	init:function(jinR){jin = jinR;},
	/*
	action (fun): performs a query action
		action (str)
	*/
	action:function(a,cb) {
		cb = cb || {};
		if (!cb.success) cb.success = function(){};
		if (!cb.fail) cb.fail = function(res){console.log('query action fail:', res)};
		jin[jin.config.query.component].action(a,cb);
	}
};
exports.e = query;