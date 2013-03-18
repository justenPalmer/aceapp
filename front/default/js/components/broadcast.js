/*
---------
BROADCAST
---------
handles all live broadcasts
*/
jin.broadcast = {
	init:function(a,cb){
		socket.broadcast(function(res){
			//console.log('api run:',a,req);
			return jin.broadcast.handle(res,{
				success:function(res){
					console.log('broadcast success:',res);
				},
				fail:function(res){
					console.log('broadcast fail:',res);
				}
			});
		});
	},
	/*
	handle (fun): incoming broadcasts 
		group
	*/
	handle:function(a,cb){
		console.log('broadcast a:',a);
		//if group, send to group action to handle
		if (a.group) return jin.groups.action(a,cb);
	}
};