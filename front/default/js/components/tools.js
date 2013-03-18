/*
-----
TOOLS
-----
Utilities that speed up dev
*/
jin.tools = {
	/*
	init (fun): sets the timezone offset
	*/
	init:function(){
		var me = this;
		var D = new Date();
		me.localOffset = D.getTimezoneOffset()*me.min + me.hour;
	},
	/*
	loop (fun): asynchronous loop method that iterates many different formats
		ary (ary): loop will iterate through each element in ary
		obj (obj): loops for each property in obj
		for (obj): loop will act similar to for loop
			i (num): start value of i
			where (obj): if where evaluates to false loop stops
				$lt (num): less than
				$lte (num): less than or equal to
				$gt (num): greater than
				$gte (num): greater than or equal to
			iter (obj): defines what occurs after each iteration of loop
				$inc (num): each iteration increment factor
		---cb---
		loop (fun)
			i (num): current iteration i
			[prop] (str): only defined if an obj is passed into loop
			next (fun): call this to start the next iteration of loop
		success (fun)
		fail (fun)
	*/
	loop:function(a,cb) {
		var me = this;
		if (!cb.fail) cb.fail = function(err){console.log('loop fail:',err)};
		if (!cb.success) cb.success = function(){};

		var cond = true;
		if (a.i === undefined) a.i=0;
		var next = a.i+1;
		var prop;
		if (a.ary) { //is an array
			if (!a.len) a.len=a.ary.length;
			cond = a.i < a.len;
		}
		else if (a.obj){
			var i=0;
			for (var p in a.obj) {
				if (i==a.i){
					prop = p;
					break;
				}
				i++;
			}
			if (!prop) cond = false;
		}
		else if (a.for) { //for loop
			if (!a.for.where) return cb.fail('no where defined');
			if (!a.for.iter) return cb.fail('no iter defined');
			if (!a.i) a.i = (a.for.i)? a.for.i: 0;
			if (a.for.where.$lte) cond = a.i <= a.for.where.$lte;
			else if (a.for.where.$lt) cond = a.i < a.for.where.$lt;
			else if (a.for.where.$gte) cond = a.i >= a.for.where.$gte;
			else if (a.for.where.$gt) cond = a.i > a.for.where.$gt;
			if (a.for.iter.$inc) next = a.i+a.for.iter.$inc;
		}
		if (cond) {
			if (!cb.loop) return cb.fail('no loop callback');
			var loop = {
				i:a.i,
				next:function(){
					//console.log('i:'+i+' ary:'+ary[i]);
					a.i = next;
					me.loop(a, cb);
				}
			};
			if (prop) loop.prop = prop;
			cb.loop(loop);
		}
		else {
			cb.success();
		}
	},

	/*
	morph (fun): morph manipulates objects in a number of different ways
		[thaw] (str): creates the target obj from a string
		[unweb] (str): convert query format to obj
		target (obj): the obj to be morphed
		[clone] (bool): if true, creates a shallow copy of the obj
		[merge] (obj): merges this object into the target, target properties are overwritten
		[shrink] (str or ary): removes attributes specified by shrink
		[separate] (ary): removes all attributes NOT in the ary
		[web] (bool): turns the object into a query string
		[freeze] (bool): turns object into a string
	*/
	morph:function(a){
		if (a.unweb) {
			a.unweb = a.unweb.replace(/\?/, '');
			a.unweb = unescape(a.unweb);
			var ary = a.unweb.split('&');
			a.target = {};
			for (var i=0,len=ary.length;i<len;i++){
				var v = ary[i].split('=');
				try {
					a.target[v[0]] = JSON.parse(v[1]);
				}
				catch(e){
					a.target[v[0]] = v[1];
				}
			}
		}
		if (a.thaw) {
			try {	
				a.target = JSON.parse(a.thaw);
			} catch(e){
				a.target = {};
			}
		}
		if (!a.target) return a.target;
		if (a.clone){
			var t = {};
			for (var attr in a.target) {t[attr] = a.target[attr];}
			a.target = t;
		}
		if (a.merge){
			for (var attr in a.merge){a.target[attr] = a.merge[attr];}
		}
		if (a.shrink){
			if (a.shrink instanceof Array) {
				for (var i=0,len=a.shrink.length;i<len;i++){
					if (a.target[a.shrink[i]] !== undefined) delete a.target[a.shrink[i]];
				}
			}
			else if (typeof a.shrink == 'string'){
				if (a.target[a.shrink] !== undefined) delete a.target[a.shrink];
			}
		}
		if (a.separate){
			for (var i in a.target){
				if (a.separate.indexOf(i) === -1) {
					delete a.target[i];
				}
			}
		}
		if (a.sort){
			var sort = [];
			for (var i in a.target){
				sort.push(i);
			}
			sort.sort();
			var sorted = {};
			for (var i=0,len=sort.length;i<len;i++){
				sorted[sort[i]] = a.target[sort[i]];
			}
			a.target = sorted;
		}
		if (a.web){
			var str='',first=true;
			for (var i in a.target){
				if (!first) str += '&';
				str += i+'='+a.target[i];
				first = false;
			}
			str = escape(str);
			if (str != '') str = '?'+str;
			return str;
		}
		if (a.freeze){
			try {
				var str = JSON.stringify(a.target);
			} catch(e){return {}}
			return str;
		}
		return a.target;
	},

	/*
	hash (fun): creates a hash from a value or random
		[value] (str): value to be hashed
		[salt] (str): salt to seed the hash
		[hash] (str): sha1, md5, sha512
		[random] (bool): if true, creates a hash from a random value
	*/
	hash:function(a){
		if (!a.hash) a.hash = 'sha512';
		var sha = crypto.createHash(a.hash);
		if (a.random) {
			var D = new Date();
			var value = String(Math.random()*D.getTime());
		}
		else {
			var value = (a.salt)? a.value+a.salt: a.value;
		}
		sha.update(value);
		var res = sha.digest('hex');
		if (a.random) res = res+D.getTime();
	
		console.log('hash:',res);
		return res;
	},

	/*
	format (fun): formats a string
		target (str): string to be formatted
		upper (str): 'first', 'all',
		truncate (num): length to truncate
		phone (str): 'usa' for us phone numbers
		trim (str): 'spaces' trims off all whitespace
	*/
	format:function(a){
		if (!a.target) return '';
		if (a.upper) {
			if (a.upper == 'first') a.target = a.target.charAt(0).toUpperCase()+a.target.slice(1);
			if (a.upper == 'all') a.target = a.target.toUpperCase();
		}
		if (a.lower) {
			if (a.lower == 'all') a.target = a.target.toLowerCase();
		}
		if (a.truncate) {
			if (a.target.length > a.truncate) a.target = a.target.substr(0,a.truncate)+'...';
		}
		if (a.phone) {
			if (a.phone == 'usa' && a.target.length > 0) a.target = a.target.substr(0,3)+'-'+a.target.substr(3,3)+'-'+a.target.substr(6,4);
		}
		if (a.trim) {
			if (a.trim == 'spaces') a.target = a.target.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		}
		if (a.paragraph){
			a.target = a.target.replace(/<(?:.|\n)*?>/gm, '').replace(/\n/g, '<br/>').replace(/\s\s/g, ' &ensp;');
		}
		if (a.links){
			a.target = a.target.replace(/(^|["'(\s\>\<]|&lt;)(www\..+?\..+?)((?:[:?]|\.+)?(?:\s|\>|\<|$)|&gt;|[)"',])/g,'$1<a target="_blank" href="<``>://$2">$2</a>$3')
				.replace(/(^|["'(\s\>\<]|&lt;)((?:(?:https?|ftp):\/\/|mailto:).+?)((?:[:?]|\.+)?(?:\s|\>|\<|$)|&gt;|[)"',])/g,'$1<a target="_blank" href="$2">$2</a>$3')
				.replace( /"<``>/g, '"http' );
		}
		return a.target;
	},
	
	/*
	validate (fun): checks if data matches set criteria
		rules (obj): JSON of input data validation {min:4,max:20}
		input (obj): JSON of incoming data {field:value}
		---cb---
		success (fun)
		fail (fun)
	*/
	validate:function(a,cb){
		var me = this;
		//loop through input
		var errors;
		var output = {};

		if (!a.rules) return cb.fail('no rules defined');

		me.loop({
			obj:a.input
		},{
			loop:function(loop){
				console.log('val prop:',loop);
				var prop = loop.prop;
				if (a.rules[prop]) {
					me.check({
						rules:a.rules[prop],
						value:a.input[prop]
					},{
						success:function(res){
							output[prop] = res;
							loop.next();
						},
						fail:function(err){
							//if (!errors) errors = {};
							//errors[prop] = err;
							errors = err
							loop.next();
						}
					});
				}
				else {
					loop.next();
				}
			},
			success:function(){
				if (errors) {
					return cb.fail(errors);
				}
				cb.success(output);
			}
		});
	},

	/*
	check (fun): checks a single value against a set of rules
		rules (obj): set of rules to test value against
			[minLen] (num): minimum length of input
			[maxLen] (num): maximum length
			[email] (bool): true to test if value is an email
			[phone] (str): 'US' to check for valid USA phone number
			[bool] (bool): converts value to a boolean
			[int] (bool): converts to integer and errors if failed
			[timestamp] (bool): tests if value is a valid timestamp
		value (any): value to test
		---cb---
		success (fun)
		fail (fun)
	*/
	check:function(a,cb){
		if (!a.rules) return cb.fail('no rules defined');

		if (a.rules.email) {
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    		if (!re.test(email)) return cb.fail('not a valid email');
		}
		if (a.rules.phone) {
			try {
				a.value = a.value.replace(/[^0-9]/g, '');
			} catch(e){
				return cb.fail('not a valid phone number');
			}
			if (a.rules.phone == 'US' && a.value.length != 10) return cb.fail('not a valid US phone number');
		}
		if (a.rules.bool) {
			a.value = (a.value)?true:false;
		}
		if (a.rules['int']){
			try {
				a.value=Math.floor(Number(a.value));
			} catch(e){
				return cb.fail('not an integer');
			}
		}
		if (a.rules.timestamp){
			try{
				new Date(a.value);
			} catch(e){
				return cb.fail('not an valid timestamp');
			}
		}
		if (a.rules.number){
			try{
				a.value= Number(a.value);
			} catch(e){
				return cb.fail('not a valid number');
			}
		}
		if (a.rules.min) {
			if (a.value.length < a.rules.min) return cb.fail('less than minimum length');
		}
		if (a.rules.max) {
			if (a.value.length > a.rules.max) return cb.fail('greater than maximum length');
		}

		cb.success(a.value);
	},

	/*
	date (fun): 
		D (date obj)
		ts (num): timestamp 
		get (str): 'ts' or 'ago',
	*/
	sec:1000,
	min:1000*60,
	hour:1000*60*60,
	day:1000*60*60*24,
	week:1000*60*60*24*7,
	month:1000*60*60*24*30,
	year:1000*60*60*24*365,
	date:function(a){
		var me = this;
		if (!a.D && !a.ts) a.D = new Date();
		var D = a.D || new Date(a.ts);
		//console.log('tools date:',D);
		if (a.get) {
			switch(a.get){
				case 'ts':
					return D.getTime();
				case 'ago':
					var nowTs = new Date().getTime();
					var diff = nowTs - D.getTime();
					if (diff < me.min) return '';
					if (diff < me.hour) return Math.round(diff/me.min)+' min ago';
					if (diff < 2*me.hour) return '1 hr ago';
					if (diff < me.day) return Math.round(diff/me.hour)+' hrs ago';
					if (diff < 2*me.day) return 'yesterday';
					if (diff < me.week) return Math.round(diff/me.day)+' days ago';
					if (diff < 2*me.week) return 'a week ago';
					if (diff < me.month) return Math.round(diff/me.week)+' weeks ago';
					if (diff < 2*me.month) return 'a month ago';
					if (diff < me.year) return Math.round(diff/me.month)+' months ago';
					if (diff < 2*me.year) return 'a year ago';
					return Math.round(diff/me.year)+' years ago';
				case 'month':
					var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
					return months[D.getMonth()];
				case 'weekday':
					var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
					return days[D.getDay()];
				case 'time':
					var hour = D.getHours();
					var min = D.getMinutes();
					if (hour == 12){
						var ap = 'p';
					}
					else if (hour > 12){
						var ap = 'p';
						hour = hour - 12;
					}
					else if (hour == 0){
						var ap = 'a';
						hour = 12;
					}
					else {
						var ap = 'a';
					}
					if (String(min).length < 2) min = '0'+min;
					return hour+':'+min+ap;
				case 'mdy':
					return (D.getMonth()+1)+'/'+(D.getDate())+'/'+(String(D.getFullYear()).substr(2));
			}
		}
	}
};