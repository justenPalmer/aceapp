/*
----
CRON
----
sets up actions to be executed over time
*/
var jin;
var cron = {
	init:function(jinR){jin = jinR;
		//start off timer on an even minute
		var D = new Date();
		var now = D.getTime();
		var min = 1000*60; //ts for minute
		var delay = now%min;
		setTimeout(function(){
			cron.run();
			cron.start();
		},delay);
	},
	refs:{},
	interval:undefined,
	procCron:false, //set to true if cron is processing
	/*
	set (fun): sets up a cron job
		path (str): unique identifier for the cron job (cron will only allow one cron to be active at a time for each path)
		when (obj): defines when the cron will run 
			repeat (str): defines how many times the cron will run, defaults to forever 1-9999...
			minute (str): defines minute cron will run on, defaults to every minute
			hour (str): defines on which hours the cron will run, defaults to every hour
			day (str): either a day of the month or week 1-31 or w1(sunday)-w7(saturday)
			month (str): the months of the year the cron will run 1-12
				range - define with '-' ex: w2-w6 or 1-18	
				list - define with ',' ex: w2,w4,5,8
				combine - combine range and list for greater control, ex: w2-w4,4,8-12
		---cb---
		success (fun): function to be called when cron runs
			D (obj): date object of when cron runs
	*/
	set:function(a,cb) {
		if (!jin.config.cron) return console.log('cron false');
		if (!a.when) a.when = {};
		var key = JSON.stringify(a.when);
		console.log('set:'+key+' '+a.path);
		if (!this.refs[key]) this.refs[key] = {};
		this.refs[key][a.path] = {cb:cb, numTimes:0};
	},
	run:function(){
		if (!this.procCron) {
			this.procCron = true;
			//check for crons that should run
			//define value for date object
			var nD = new Date();
			var nowTs = nD.getTime() + jin.config.timezoneOffset*1000*60*60;
			var D = new Date(nowTs);
			var now = {
				month:D.getMonth()+1,
				dayMo:D.getDate(),
				dayWk:'w'+(D.getDay()+1),
				hour:D.getHours()+1,
				minute:D.getMinutes()
			};
			
			//console.log('cron ran:',now);
			for (var key in this.refs) {
				var kO = JSON.parse(key);
				//check if key is active
				//console.log('cron checked:',key);
				if (this.checkKey(now, kO)) { //check if key is active
					for (var path in this.refs[key]) {
						var cr = this.refs[key][path];
						if (!cr.repeat || cr.numTimes < cr.repeat) { //if repeat is defined and numTimes is less then repeat
							//console.log('cron ran:'+key+' '+path);
							if (cr.cb && cr.cb.success) cr.cb.success(D);
							cr.numTimes++;
						}
					}
				}
			}
			this.procCron = false; //@todo: add to completion callback instead
		}
	},
	checkKey:function(now, check){
		for (var i in now) { //for each of month, dayMo, etc
			var chkI = (i=='dayMo' || i=='dayWk')? i.replace(/Wk|Mo/, '') : i;
			//console.log('check:',now[i], chkI, check[chkI]);
			if (!this.check(now[i], check[chkI])){ //failed test
				if (i=='dayMo' || i=='dayWk') { //day
					if (failedDay) return false;
					var failedDay = true;
				}
				else {
					return false;
				}
			}
		}
		return true;
	},
	check:function(now, check){
		if (!check || this.evalExp(check).indexOf(String(now)) !== -1) return true; //check not defined or is in array
		return false;
	},
	evalExp:function(exp, ary){
		if (!ary) ary = [];
		if (!exp) return ary;
		exp = String(exp);
		var pos = exp.search(/[\,\-]/);
		if (pos != -1) { //sign found
			var sign = exp.substr(pos,1);
			var num1 = exp.substr(0,pos).replace(/\s/, '');
			if (sign == '-') { //range
				var end = exp.substr(pos+1).search(/[\,\-]/);
				end = (end == -1)? exp.length:end+pos;
				//console.log('end:',end);
				var num2 = exp.substr(pos+1,end-pos).replace(/\s/, '');
				for (var i=Number(num1.replace(/w/, '')),len=Number(num2.replace(/w/, ''));i<=len;i++){
					var val = (num1.search(/w/) != -1)? 'w'+i:String(i);
					if (val.length > 0){
						ary.push(val);
					}	
				}
				
				cron.evalExp(exp.substr(end+2), ary);
			}
			else if (sign == ','){
				var val = num1.replace(/\s/, '');
				if (val.length > 0) {
					ary.push(val);
				}
				cron.evalExp(exp.substr(pos+1), ary);
			}
		}
		else { //only one number
			var val = exp.replace(/\s/, '');
			if (val.length > 0) {
				ary.push(val);
			}
		}
		return ary;
	},
	start:function(){
		this.stop();
		cron.interval = setInterval(function(){
			cron.run();
		}, 1000*60);
	},
	stop:function(){
		clearInterval(cron.interval);
	}
};
exports.e = cron;