
var TEST_ROOT = './test/roundtrip/';

var fs = require('fs');
var util = require('util');

var datalog = require('./gen/datalog');
console.log(util.inspect(datalog));

//Load each program in ./tests/$test/inputs/
//Run the query in ./tests/$test/query.datalog
//serialize result, compare with ./tests/$test/facit.datalog

var Fork = function(counter, callback){
	this.counter = counter;
	this.callback = callback;
	this.data = {};
	this.join = function(data){
		this.counter--;
		for(var prop in data){
			this.data[prop] = data[prop];
		}
		if(this.counter == 0){
			callback(this.data);
		}
	}
}


var Test = function(root, folder){
    this.id = root + folder
    console.log("Adding suite " + this.id);
    this.folder = this.id;
};
Test.prototype.run = function(){
    var self = this;
    var inputdir = self.folder + "/inputs/";
    fs.readdir(inputdir, function(err, inputFiles){
    	if(err){
    		self.fail(err);
    	} else {
    		var program = new datalog.Program();
    		var c = inputFiles.length;
    		var fork = new Fork(c, function(){
    			fs.readFile(self.folder + "/query.datalog", function(err, queryData){
    				var parser = new datalog.Parser();
    				var goals = [];
    				parser.on('rule', function(rule){
    					goals.push(rule);
    				});
    				parser.on('syntaxError', function(err){
    					self.fail(err);
    				});
    				parser.on('success', function(){
    					program.query(goals, function(responseTuples){
    						var response = [];
    						responseTuples.forEach(function(tuple){
    							response.push(tuple.toString());
    						});
    						response.sort();
    						fs.readFile(self.folder + "/facit.datalog",	function(err, content){
    							if(err){
    								self.fail(err);
    							} else {
    								var lines = new String(content).split("\n");
    								lines.sort();
										lines = lines.filter(function(line){
											return line != "";
										});
										if(lines.length == response.length){
    									var match = true;
    									for(var i = 0; i< lines.length;i++){
    										if(lines[i] != response[i]){
    											match = false;
    											self.fail("["+response[i]+"] != [" + lines[i] + "]");
    											break;
    										}
    									}
    									if(match){
    										self.pass("");
    									}
    								} else {
    									response.forEach(function(r){
    										//console.log(util.inspect(r.a.slots));
    										//console.log(util.inspect(r.b.head));
    									});
    									self.fail("[" + util.inspect(response) + "] != [" + util.inspect(lines) + "]");
    								}
    							}
    						});
    					});
    				});
    				parser.parse(new String(queryData));
    			});
    		});
    		inputFiles.forEach(function(fileName){
    			var filePath = inputdir + fileName;
    			fs.readFile(filePath, function(err, fileContent){
    				if(err){
    					self.fail(err);
    					return;
    				}
    				var parser = new datalog.Parser();
    				parser.on('rule', function(rule){
    					program.addRule(rule);
    				});
    				parser.on('syntaxError', function(err){self.fail(err);});
    				parser.on('success', function(){fork.join();});
    				parser.parse(new String(fileContent));
    			});
    		});
    	}
    });
};
Test.prototype.fail = function(msg){
    console.log("FAIL " + this.id + " " + msg);
}
Test.prototype.pass = function(msg){
    console.log("PASS " + this.id + " " + msg);
}


var tests = [];

if(process.argv.length > 2){
	new Test(TEST_ROOT, process.argv[2]).run();
} else {
	var testfolders = fs.readdirSync(TEST_ROOT);
	for(var ix in testfolders){
		new Test(TEST_ROOT, testfolders[ix]).run();
	}
}
