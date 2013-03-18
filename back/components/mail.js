/*
----
MAIL
----
sends emails
*/
var mailer = require('mailer');

var jin;
var mail = {
	refs:{},
	init:function(jinR){jin = jinR;},
	
	/*
	send (fun): sends an email
		to (str): email to send to
		subject (str): subject of email
		body (str): body of email
	*/
	send:function(a){
		var account = jin.config.mail
		mailer.send({
			host:account.host,
			port:account.port,
			ssl:false,
			domain:account.host,
			authentication:'login',
			username:account.username,
			password:account.password,
			to:a.to,
			from:account.username,
			subject:a.subject,
			body:a.body
		}, function(err, result){
			if (err) return console.log(err);
		});
	}
};
exports.e = mail;