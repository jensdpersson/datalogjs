


 (function(){

	var Predicate = datalog.Predicate;
	var Goal = datalog.Goal;

	datalog.Program = function(){
		this.rules = [];
		this.predicates = {};

		var self = this;

		this.lookup = function(predid){
			return self.predicates[predid];
		}
	}

	datalog.Program.prototype.addRule = function(rule){
		this.rules.push(rule);

		var predicateId = rule.head.predicateId();
		var predicate = this.predicates[predicateId];
		if(!predicate){
		   predicate = new Predicate(predicateId, this.lookup);
		   this.predicates[predicateId] = predicate;
		}
		predicate.addRule(rule);

	}

	datalog.Program.prototype.query = function(goals, callback){
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

	datalog.Program.prototype.validate = function(){
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
})();
