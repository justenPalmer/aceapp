/*
---
API
---
Front end API request handler
*/
jin.api = {
	init:function(){},
	/*
	send (function): sends an api method call
		send (object): JSON object of all information to send to api method
			post (boolean): set to true if only post should be used
			api (string): api method
			data (object): data to send to api method
			[callbacks] (object): JSON object of all callbacks
				[success] (callback): triggered on successful response from api
					response (object): response from the api method
						api (string): api method
						data (object): data returned from api call
					sent (object): data sent to api method
						api (string): api method
						data (object): data sent to api method
				[fail] (callback): triggered on failed response from api
					response (object): response from the api method
						api (string): api method
						data (object): data returned from api call
					sent (object): data sent to api method
						api (string): api method
						data (object): data sent to api method			
	*/
	send:function(a,cb) {
		if (!cb) cb = {};
		if (!cb.success) cb.success =function(res){console.log('api success:',res);}
		if (!cb.fail) cb.fail =function(res){console.log('api fail:',res);}

		if (a.post || !socket) { //if socket open
			a.send = {escape:escape(JSON.stringify(a.send))};
			console.log('api:','api/'+a.api);
			$.post('/api/'+a.api, a.send, function(res){
				try {
					res = JSON.parse(res);
				}
				catch(e){}
				if (res.success) cb.success(res);
				if (!res.success) cb.fail(res);
			});
		}
		else if (a.get){
			a.send = {escape:escape(JSON.stringify(a.send))};
			console.log('api:','api/'+a.api);
			$.get('/api/'+a.api, a.send, function(res){
				try {
					res = JSON.parse(res);
				}
				catch(e){}
				if (res.success) cb.success(res);
				if (!res.success) cb.fail(res);
			});
		}
		else if (a.go){
			window.location = '/api/'+a.api+'?escape='+escape(JSON.stringify(a.send));
		}
		else { //socket exists
			a.send.api = a.api;
			socket.api(a.send, cb);
		}
	}
};