

(function(){

	var Aggregation = datalog.Aggregation;
	var Substitution = datalog.Substitution;
	var Tuple = datalog.Tuple;

	datalog.Goal = function(tuple, theory){
		//this.solutionListeners = [];
		//this.tuple = tuple;
		this.theory = theory;
		this.solutionTemplate = tuple.renamedCopy("'");
	};

	var Goal = datalog.Goal;

	//Goal.prototype.on = function(evt, listener){
	//	this.solutionListeners.push(listener);
	//}

	//Goal.prototype.emit = function(evt){
	//	this.solutionListeners.forEach(function(listener){
	//		listener(evt);
	//	});
	//}

	datalog.Goal.prototype.toString = function(){
		return this.solutionTemplate.toString();
	}

	datalog.Goal.prototype.solve = function(callback){

		//onDone = onDone || function(){};

		var pred = this.theory.lookup(this.solutionTemplate.predicateId());
		if(!pred){
		//	callback();
			return;
		}

		console.log("Solving for " + this + " using " + pred.rules);

		var goal = this;

		//var branchCount = pred.rules.length;

		//var aggregations = [];

		//var isDone = function(){
		//	console.log("isDone? " + branchCount);
		//	branchCount--;
		//	return (branchCount < 1);
		//}

		pred.rules.forEach(function(rule){

			console.log("RULE:" + rule);

		  var aggregation = new Aggregation(rule.getAggregators());
			//aggregations.push(aggregation);

			var subst = new Substitution();
			if(!subst.merge(goal.solutionTemplate, rule.head)){
				//if(isDone()){
					//callback();
				//}
				return;
			}

			var subgoals = rule.body;

			var handleSolution = function(subst, nextIndex){
				//var allSubGoalsDone = true;
				if(subgoals.length <= nextIndex){
					var toEmit = goal.solutionTemplate.ground(subst);
					//goal.emit(toEmit);
					//When can aggregation emit its solution? TODO
					aggregation.merge(toEmit);
//HERE decrease branch count?
					return;
				}
				var newTuple = subgoals[nextIndex].ground(subst);
				var subgoal = new Goal(newTuple, goal.theory);
				subgoal.solve(function(solution){
					//if(solution){
						subst2 = new Substitution(subst);
						subst2.merge(solution, newTuple);
						handleSolution(subst2, nextIndex+1);
					//} else {

					//}
				});
				//var onSubGoalDone = function(){
				//	allSubGoalsDone = true;
				//}
			//	allSubGoalsDone = false;
				//subgoal.solve(onSubGoalDone);
			};

			handleSolution(subst, 0);
			aggregation.emitSolutions(function(solution){
				console.log("Agg emitting solution " + solution);
				callback(solution);
			});
		});
	}
})();
