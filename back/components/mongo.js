/*
-----
MONGO
-----
controls queries to mongo
*/
var mongoObj = require('mongodb');
var jin;
var mongo = {
	init:function(jinR){
		console.log('mongo init');
		jin = jinR;
		var me = this;
		me.selectDb({}, {success:function(){},fail:function(){}});
	},

	/*
	id (fun): converts an id into a mongo id object
		id (str or obj)
	*/
	id:function(a) {
		var me = this;
		if (typeof a.id == 'string') {
			try {
				var objId = me.openDb.bson_serializer.ObjectID(a.id);
			}
			catch(e){
				var objId = a.id;
			}
			return objId;
		}
		return a.id;
	},

	/*
	action (fun): handles all db queries
		action (str): action to perform ('find', 'insert', 'update', 'upsert', 'remove')
		[db] (str): database to query - defaults to main db
		col
		[find]
		[sort]
		[limit]
		[skip]
		[distinct]
		[insert]
		[update]
		[where]
		[upsert]
		---cb---
		success (fun)
		fail (fun)
	*/
	action:function(a,cb){
		var me = this;

		//setup callbacks
		if (!cb) cb = {};
		if (!cb.success) cb.success = function(res){};
		if (!cb.fail) cb.fail = function(res){console.log('mongo err:',res)};
		
		//setup a
		if (!a.action) return cb.fail('no action defined:',a);

		me.selectDb(a, {
			success:function(a){
				//console.log('select db done:',a.col);
				if (!a.col) return cb.fail('no collection defined');

				me.selectCol(a,{
					success:function(a){
						//console.log('mongo action:',a.action);
						var index = 'qry'+jin.tools.format({target:a.action,upper:'first'});
						//console.log('mongo index:',index);
						if (me[index]) return me[index](a,cb);
						return cb.fail('query action not defined:',index);
					},
					fail:function(res){
						cb.fail(res);
					}
				});
			},
			fail:function(res){
				cb.fail(res);
			}
		});
	},

	/*
	selectDb (fun): select db to query
		db (str): database to query
		---cb---
		success (fun)
		fail (fun)
	*/
	selectDb:function(a,cb){
		var me = this;
		if (!a.db) a.db = jin.config.query.mongo.db;
		if (!me.openDb) me.openDb = undefined;
		if (!me.openDbs) me.openDbs = {};
		if (me.openDbs[a.db]) {
			a.dbRef = me.openDbs[a.db];
			return cb.success(a);
		}
		me.openDb = new mongoObj.Db(a.db, new mongoObj.Server(jin.config.query.mongo.ip, jin.config.query.mongo.port, {}));
		me.openDb.open(function(err, dbOpen){
			if (err) return cb.fail(err);
			a.dbRef = me.openDb;
			me.openDbs[a.db] = me.openDb;
			cb.success(a);
		});
	},

	/*
	selectCol (fun): select a collection in a db
		dbRef (obj): reference to open db
		col (str): collection name
		---cb---
		success (fun)
		fail (fun)
	*/
	selectCol:function(a,cb){
		var me = this;
		var dbName = a.dbRef.databaseName;
		if (!this.cols) this.cols = {}; //setup ref
		if (!this.cols[dbName]) this.cols[dbName] = {};
		if (!this.cols[dbName][a.col]) {
			return a.dbRef.collection(a.col, function(err, colRef) {
				if (err) return cb.fail(err);
				me.cols[dbName][a.col] = colRef;
				a.colRef = me.cols[dbName][a.col];
				cb.success(a);
			});
		}
		a.colRef = me.cols[dbName][a.col];
		cb.success(a);
	},

	/*
	qryFind (fun): find
		colRef (obj): collection reference
		[find]
		[sort]
		[limit]
		[skip]
		[distinct]
		---cb---
		success (fun)
		fail (fun)
	*/
	qryFind:function(a,cb){
		var me = this;
		if (!a.colRef) return cb.fail('no collection selected');
		if (!a.find) a.find = {};
		if (!a.find._id && a.find.id) {
			a.find._id = me.id({id:a.find.id});
		}
		a.find = jin.tools.morph({target:a.find, shrink:'id'});
		if (!a.sort) a.sort = {_id:-1};
		if (!a.limit) a.limit = 100;
		if (!a.skip) a.skip = 0;

		var options = {sort:a.sort,limit:a.limit,skip:a.skip};

		if (a.distinct) options.distinct = a.distinct;

		a.colRef.find(a.find,options).toArray(function(err,res){
			if (err) return cb.fail(err);
			if (res && res.length > 0) { 
				for (var i=0,len=res.length;i<len;i++) {
					res[i].id = String(res[i]._id);
				}
				//console.log('find res:',res);
				return cb.success(res);
			}
			return cb.success(false);
		});
	},

	/*
	qryCount (fun): counts all the results of a find
		colRef
		[find]
		---cb---
		success (fun)
		fail (fun)
	*/
	qryCount:function(a,cb){
		var me = this;
		if (!a.colRef) return cb.fail('no collection selected');
		if (!a.find) a.find = {};
		if (!a.find._id && a.find.id) {
			a.find._id = me.id({id:a.find.id});
		}
		a.find = jin.tools.morph({target:a.find, shrink:'id'});

		var options = {};
		if (a.distinct) options.distinct = a.distinct;

		a.colRef.find(a.find,options,function(err,res){
			if (err) return cb.fail(err);
			res.count(function (e, count) {
	      	return cb.success({count:count});
	      });
		});
	},

	/*
	qryInsert (fun): insert 
		colRef (object): collection reference
		insert
		---cb---
		success (fun)
		fail (fun)
	*/
	qryInsert:function(a,cb){
		var me = this;
		if (!a.colRef) return cb.fail('no collection selected');
		if (!a.insert) return cb.fail('no insert defined');

		a.insert.created = jin.tools.date({get:'ts'});

		a.colRef.insert(a.insert, function(err, res) {
			if (err) return cb.fail(err);

			me.qryFind({
				colRef:a.colRef,
				find:a.insert,
				sort:{created:-1}
			},{
				success:function(res){
					if (!res || !res[0]) return cb.success(a.insert);

					res[0].id = String(res[0]._id);
					return cb.success(res[0]);
				}
			});
		});
	},

	/*
	qryUpdate (fun): update
		colRef (object): collection reference
		where
		update
		---cb---
		success (fun)
		fail (fun)
	*/
	qryUpdate:function(a,cb){
		var me = this;
		if (!a.colRef) return cb.fail('no collection selected');
		if (!a.where) a.where = {};
		if (!a.update) return cb.fail('no update defined');

		if (!a.where._id && a.where.id) {
			a.where._id = me.id({id:a.where.id});
		}
		a.where = jin.tools.morph({target:a.where, shrink:'id'});

		if (!a.update.$set) a.update.$set = {}; 
		a.update.$set.updated = jin.tools.date({get:'ts'});

		a.colRef.findAndModify(a.where, [['_id', 'asc']], a.update, {'new':true}, function(err, res){
			if (err) return cb.fail(err);

			if (res && res._id) res.id = String(res._id);
			return cb.success(res);
		});
	},

	/*
	qryUpsert (fun): upsert
		colRef (object): collection reference
		where
		upsert
		---cb---
		success (fun)
		fail (fun)
	*/
	qryUpsert:function(a,cb){
		var me = this;
		if (!a.colRef) return cb.fail('no collection selected');
		if (!a.where) a.where = {};
		if (!a.upsert) return cb.fail('no upsert defined');

		if (!a.upsert.$set) a.upsert.$set = {}; 

		if (a.where.id !== undefined && a.where.id === 0) { //id is zero, create new rec
			a.where = {updated:-1};
			a.upsert.$set.created = jin.tools.date({get:'ts'});
		}
		
		if (!a.where._id && a.where.id) {
			a.where._id = me.id({id:a.where.id});
		}
		a.where = jin.tools.morph({target:a.where, shrink:'id'});

		console.log('upsert:',a.where,a.upsert);
		
		a.upsert.$set.updated = jin.tools.date({get:'ts'});

		a.colRef.findAndModify(a.where, [['_id', 'asc']], a.upsert, {'new':true,upsert:true}, function(err, res){
			if (err) return cb.fail(err);

			if (res && res._id) res.id = String(res._id);
			return cb.success(res);
		});
	},

	/*
	qryRemove (fun): remove
		colRef
		where
		---cb---
		success (fun)
		fail (fun)
	*/
	qryRemove:function(a,cb){
		var me = this;
		if (!a.colRef) return cb.fail('no collection selected');
		if (!a.where) a.where = {};

		if (!a.where._id && a.where.id) {
			a.where._id = me.id({id:a.where.id});
		}
		a.where = jin.tools.morph({target:a.where, shrink:'id'});
		//console.log('where:',a.where);
		a.colRef.remove(a.where, function(err, res) {
			if (err) return cb.fail(err);
			cb.success(res);
		});
	}
};
exports.e = mongo;