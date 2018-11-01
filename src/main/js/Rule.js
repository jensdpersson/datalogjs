

datalog.Rule = (function(){

	//var AGGREGATORS = require('./AGGREGATORS');
	var Tuple = datalog.Tuple;
	var Aggregator = datalog.Aggregator;
	var Grouping = datalog.Grouping;
	var Factory = datalog.Factory;

	console.log("Aggregator:" + Aggregator);

	var Rule = function(predicateSymbol){
		this.head = new Tuple(predicateSymbol);
		this.body = [];
	};

	Rule.prototype.addSubGoal = function(predicateSymbol){
		this.body.push(new Tuple(predicateSymbol));
	}

	Rule.prototype.lastSubGoal = function(){
		if(this.body.length == 0){
			return null;
		}
		return this.body[this.body.length-1];
	}

	Rule.prototype.getAggregators = function(){
		if(!this.aggregators){
			this.aggregators = [];
			for(var i=1;i<this.head.slots.length;i++){
				var slot = this.head.slots[i];
				var agg = null;
				if(slot.aggregator){
					agg = new Factory(Aggregator, slot.aggregator);
				} else {
					agg = new Factory(Grouping);
				}
				//agg.setIndex(i);
				//agg.setTemplateChain(this.aggregators);
				this.aggregators.push(agg);
			}
		}
		return this.aggregators;
	}

	Rule.prototype.toString = function(){
		var retval = this.head.toString();
		for(var i = 0; i< this.body.length;i++){
			if(i != 0){
				retval += ", ";
			} else {
				retval += " :- "
			}
			retval += this.body[i].toString();
		}
		return retval + ".";
	}

	return Rule;
}());
