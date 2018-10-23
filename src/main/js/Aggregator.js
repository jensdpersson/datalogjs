
var Term = require('./Term');

module.exports = (function(){

	var AGGREGATORS = {
			max: function(acc, val){
				if(acc > val){
					return acc;
				}
				return val;
			},
			sum: function(acc, val){
				if(val == null){
					return acc;
				}
				return acc + val;
			},
			avg: function(acc, val){
				if(!acc){
					return {sum:0, count:0};
				}
				if(val){
					acc.sum += val;
					acc.count += 1;
				} else {
					return acc.sum / acc.count;
				}
			}
	};

	var Aggregator = function(name){
		var aggregator = AGGREGATORS[name];
		if(!aggregator){
			throw "Unrecognized aggregator ["+name+"]";
		}
		this.func = aggregator;
		this.acc = null;
	}

	//Aggregator.prototype.setIndex = function(index){
	//	this.index = index;
	//}

	//Aggregator.prototype.setTemplateChain = function(template){
	//	this.template = template;
	//}

	Aggregator.prototype.merge = function(term, nextFactory){
		console.log("Aggregator.merge");
		this.acc = this.func(this.acc, term.value());
		if(!this.next){
			this.next = nextFactory.create();
		}
		return this.next;
	}


	Aggregator.prototype.report = function(tuple, callback){
		console.log("REPORT Aggregator " + this);
		tuple.addTerm(Term.constant(this.acc));
		if(this.next){
			this.next.report(tuple, callback);
		} else {
			console.log("EMITTING SOLUTION " + tuple);
			callback(tuple);
		}
	}

	return Aggregator;

})();
