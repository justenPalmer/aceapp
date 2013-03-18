/*
---------
api:GROUP
---------
*/
var jin;
var group = {
	init:function(jinR){jin = jinR;},
	run:function(a,cb){
		jin.groups.action(a,cb);
	}
};
exports.e = group;