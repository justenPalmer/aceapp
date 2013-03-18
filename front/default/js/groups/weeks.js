jin.g.weeks = {
	/*
	get (fun): gets first day of week timestamp
	*/
	get:function(D){
		if (!D) D = new Date();

		//advance one day week end

		//set week with mm-dd-yyyy for first day of week
		var dow = D.getDay();
		
		if (dow == 0){
			dow = 6; //move sunday to the end of the week
		}
		else {
			dow -= 1;
		}

		var firstD = new Date(D.getTime() - jin.tools.day*dow);
		return firstD.getFullYear()+'-'+(firstD.getMonth()+1)+'-'+firstD.getDate();

		//return D.setHours(0,0,0,0) - jin.tools.day*D.getDay();
		//return new Date(D.getFullYear(), D.getMonth(), D.getDate()).getTime() - (jin.tools.day*D.getDay());
	},

	getD:function(week){
		var wAry = week.split('-');
		return new Date(wAry[0],wAry[1]-1,wAry[2]);
	},

	getTs:function(week){
		var me = this;
		return me.getD(week).getTime();
	},

	/*
	getDisp
	*/
	getDisp:function(week){
		//console.log('get disp:',week);
		var me = this;
		var D = me.getD(week);
		var dow = D.getDay();

		//end of week adjustment
		if (dow == 0){
			dow = 6; //move sunday to the end of the week
		}
		else {
			dow -= 1;
		}

		var lastD = new Date(D.getTime() + jin.tools.day*(6-dow)); //get last day of the week

		var monthStart = D.getMonth()+1;//jin.tools.date({D:D,get:'month'});
		var monthEnd = lastD.getMonth()+1;//jin.tools.date({D:lastD,get:'month'});
		return monthStart+'/'+me.getOrdinalDay(D)+' - '+monthEnd+'/'+me.getOrdinalDay(lastD);
	},

	/*
	getOrdinalDay
	*/
	getOrdinalDay:function(D){
		return jin.tools.format({target:D.getDate()});
	},

	/*
	addHours (fun):adds to a week's hours
		group
		hours
	*/
	addHours:function(a){
		var me = this;
		//console.log('add hours:',a.hours);
		if (!me.hours) me.hours = {};
		if (!me.hours[a.group.id]) me.hours[a.group.id] = 0;
		me.hours[a.group.id] = me.hours[a.group.id] + a.hours;


		/*
		jin.groups.action({
			action:'getRecs',
			group:a.group,
			key:new Date().getTime()
		},{
			success:function(recs){
				jin.groups.action({
					action:'updateRec',
					group:a.group,
					rec:{
						total:recs[0].total+a.hours
					}
				});
			}
		});
		*/
	},

	/*
	resetHours
	*/
	resetHours:function(a){
		var me = this;
		if (me.hours && me.hours[a.group.id]) me.hours[a.group.id] = 0;
	},

	/*
	getHours
		group
	*/
	getHours:function(a){
		var me = this;
		if (me.hours && me.hours[a.group.id]) return me.hours[a.group.id];
		return 0;
	}
};