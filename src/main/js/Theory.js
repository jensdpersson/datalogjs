
var Predicate = require('./Predicate.js');
var Goal = require('./Goal.js');

module.exports = (function(){

	function Theory(){
		this.rules = [];
		this.predicates = {};

		var self = this;

		this.lookup = function(predid){
			return self.predicates[predid];
		}
	}

	Theory.prototype.addRule = function(rule){
		this.rules.push(rule);

		var predicateId = rule.head.predicateId();
		var predicate = this.predicates[predicateId];
		if(!predicate){
		   predicate = new Predicate(predicateId, this.lookup);
		   this.predicates[predicateId] = predicate;
		}
		predicate.addRule(rule);

	}

	Theory.prototype.query = function(goals, callback){
		var answerset = [];
		for(var ix in goals){
			var goal = new Goal(goals[ix].head, this);
			//goal.on('solution', );
			goal.solve(function(solution){
				console.log("Got top solution " + solution);
				if(solution){					
					answerset.push(solution);
				}
			});
		}
		callback(answerset);
	}

	Theory.prototype.validate = function(){
		var errors = [];
		for(var predId in predicates){
			var pred = predicates[predId];
			var lowerBounds = 0;
			var cycle = pred.checkForCrossStrataCycle(lowerBounds);
			if(cycle != null){
				errors.push(cycle);
			}
		}
		return errors;
	}

	return Theory;
})();
