


 (function(){

	var Predicate = datalog.Predicate;
	var Goal = datalog.Goal;
	var Term = datalog.Term;

	datalog.Program = function(){
		this.rules = [];
		this.predicates = {};

		var self = this;

		this.lookup = function(predid){
			return self.predicates[predid];
		}
	}

	datalog.Program.prototype.addRule = function(rule){
	    
	    if (!(rule instanceof datalog.Rule)) {
	        var head = rule.head;
	        var rule2 = new datalog.Rule(head[0]);
	        for (let i=1; i<head.length; i++) {
	            rule2.head.addTerm(Term.create(head[i]));
	        }
	        var body = rule.body;
	        if (body) {
	            for (let i=0; i<body.length; i++) {
	                let bodyterm = body[i];
	                let tuple = rule2.addSubGoal(bodyterm[0]);
	                for (let j=1; j<bodyterm.length; j++) {
	                    tuple.addTerm(Term.create(bodyterm[j]));
	                }
	            }
	        }
	        rule = rule2;
	    }
	    
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
			//var goal = new Goal(goals[ix].head, this);
			var tuple = goals[ix];
			if (!(tuple instanceof datalog.Tuple)) {
			    var tuple2 = new datalog.Tuple(tuple[0]);
			    for (var i=1;i<tuple.length;i++) {
			        tuple2.addTerm(Term.create(tuple[i]));
			    }
			    tuple = tuple2;
			}
			var goal = new Goal(tuple, this);
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
