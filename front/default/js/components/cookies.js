/*
-------
COOKIES
-------
stores and retrieves browser cookies
*/
jin.cookies = {
	/*
	set (fun): stores a cookie on client
		name (str): name of cookie to be stored
		[value] (str): value to be stored in cookie, set value to null to destroy cookie
		[expires] (int): days from now that the cookie will expire in
		[path] (str): folders that cookie will be available to, use '/' for all folders
		[secure] (bool): for https cookies
	*/
	set:function(a){
		if (a.value === null) a.expires = -1; //destroy cookie
		//console.log('set cookie:',a.value,a.path);
		if (typeof a.expires === 'number') {
			var days = a.expires, t = a.expires = new Date();
			t.setDate(t.getDate() + days);
   	}
		a.value = String(a.value);
		return (document.cookie = [
			encodeURIComponent(a.name), '=',
			a.raw ? value : encodeURIComponent(a.value),
			a.expires ? '; expires=' + a.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
			a.path ? '; path=' + a.path : '',
			a.domain ? '; domain=' + a.domain : '',
			a.secure ? '; secure' : ''
     ].join(''));
	},
	/*
	get (fun): gets a cookie value
		name (str): name of cookie to be stored
		[raw] (bool): if true, do not decode value
		---return---
		(str): value stored in cookie
	*/
	get:function(a) {
   	var result, decode = a.raw ? function (s) { return s; } : decodeURIComponent;
   	return (result = new RegExp('(?:^|; )' + encodeURIComponent(a.name) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
	}
};
