/*
--------
COMPRESS
--------
Compresses a folder into a file
*/
var fs = require('fs');
var jin;
var compress = {
	refs:{},
	init:function(jinR){jin = jinR;},

	/*
	dirToFile (fun): crawls a directory and condenses all files into one single file
		dir (str): name of directory to condense
		destination (str): name of file to write all contents into
		ext (str): extension of files to write, defaults to .html
		exclude (ary): array of files to exclude
		order (ary): array of files in order to be included
		---cb---
		
	*/
	dirToFile:function(a,cb){	
		var me = this;
		//console.log('compile dir:'+dir);
		if (!a.ext) a.ext = '.html';
		if (!a.exclude) a.exclude = [];
		if (!a.output) a.output = '';
		fs.unlink(a.destination, function(){
			if (a.dirs) { //multiple directories
				var output = '';
				jin.tools.loop({
					ary:a.dirs
				},{
					loop:function(loop){
						a.dirs[loop.i].output = '';
						me.compressDir(a.dirs[loop.i],{
							success:function(res){
								//console.log('comp:'+res.output.substr(0,40));
								if (res.output) output += res.output;
								loop.next();
							},
							fail:function(res){
								loop.next();
							}
						});
					},
					success:function(){
						//console.log('compiled:'+output.substr(0,100));
						fs.writeFile(a.destination, output, 'utf-8', function(){
							//console.log('compile written:'+a.dir+'/'+a.file);
							cb.success({output:output});
						});
					}
				});
				return;
			}
			me.compressDir(a,{
				success:function(res){
					//console.log('compiled:'+res.output);
					fs.writeFile(a.destination, res.output, 'utf-8', function(){
						//console.log('compile written:'+a.dir+'/'+a.file);
						cb.success(res);
					});
				},
				fail:function(res){
					cb.fail(res);
				}
			});
		});
	},
	
	/*
	compressDir (fun): 
		dir (str):
		
	*/
	compressDir:function(a,cb){
		//console.log('compress dir:',a.dir,a.exclude);
		var me = this;
		//recursive directory read
		fs.readdir(a.dir, function(err, fileAry) {
			if (!fileAry || err) return cb.fail('files not found');
			fileAry.sort();
			//order by order elements first
			if (a.order) {
				var nAry = [];
				for(var i=0,len=a.order.length;i<len;i++) {
					var ind = fileAry.indexOf(a.order[i]);
					if (ind != -1) { //file found in order ary
						nAry.push(fileAry.splice(ind,1));
					}
				}
				fileAry = nAry.concat(fileAry);
			}
			
			//console.log('files:'+fileAry);
			if (!fileAry) return;
			jin.tools.loop({
				ary:fileAry
			},{
				loop:function(loop){
					//console.log('exclude:'+fileAry[loop.i]+' '+a.exclude+' ind:'+a.exclude.indexOf(fileAry[loop.i]));
					if (a.exclude && a.exclude.indexOf(fileAry[loop.i]) !== -1) return loop.next(); //if file is in exclude ary
					//console.log('not excluded');
					a.file = a.dir+fileAry[loop.i];
					me.compressFile(a,{
						success:function(){
							loop.next();
						}
					});
				},
				success:function(){
					//console.log('compress a:',a);
					cb.success(a);
				}
			});
		});
	},

	/*
	compressFile (fun)
	*/
	compressFile:function(a,cb){
		//console.log('compress file:',a);
		var me = this;
		if (a.file.indexOf('.'+a.ext) === -1) {
			return fs.stat(a.file, function(err, stat) {
				if (stat && stat.isDirectory()) { //is a directory
					var b = jin.tools.morph({target:a,clone:true,merge:{dir:a.file+'/'}});
					me.compressDir(b, {
						success:function(res){
							a.output = res.output;
							return cb.success();
						}
					});
				}
				else {
					return cb.success();
				}
			});	
		}
	 
		fs.readFile(a.file, 'utf-8', function (err, output) {
			if (err) return cb.success();
			//console.log('file output:',output);
			a.output += output;
			cb.success();
		});
	}
};
exports.e = compress;