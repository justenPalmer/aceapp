/*
-------
SESSION
-------
Handles all session variables
*/
jin.session = {
	data:{},
	
	/*
	set (fun): stores all props and values in the session
		data (any): to be stored in session
	*/
	set:function(a){
		var me = this;
		for (var i in a){
			me.data[i] = a[i];
		}
	},

	/*
	get (fun): retrieves a property from the session data
		props (str or ary)
	*/	
	get:function(a){
		var me = this;
		if (typeof a == 'string'){
			return me.data[a];
		}
		if (typeof a == 'array'){
			return jin.tools.morph({target:me.data,clone:true,separate:a});
		}
	},

	/*
	clear (fun): clears the session data
	*/
	clear:function(){
		var me = this;
		me.data = {};
	}
};