var datalog = {}; if(typeof(module)!='undefined'){ module.exports = datalog; };
datalog.Term = (function(){
	
	var Term = function(symbol, isVar, aggregator){
		this.symbol = symbol;
		this.isVar = !!isVar;
		this.aggregator = aggregator;
		this.isAggregate = !!aggregator;
	};
	
	Term.constant = function(symbol){
		return new Term(symbol);	
	}
	Term.aggregator = function(symbol, aggregator){
		return new Term(symbol, true, aggregator);	
	}
	Term.variable = function(symbol){
		return new Term(symbol, true);	
	}
	
	Term.prototype.value = function(){
		var num = Number(this.symbol);
		if(isNaN(num)){
			throw "Term " + this + " is not numeric in value()";
		}
		return num;
	};
	
	Term.prototype.toString = function(){
		return "Term(" + this.symbol + "," + this.isVar + ")";
	}
	
	return Term;
})();
(function(){

	var Term = datalog.Term;

	datalog.Tuple = function(predicateSymbol){
		this.isNegated = false;
		this.slots = [];
		if(predicateSymbol){
			this.slots.push(predicateSymbol);
		}
	};

	var Tuple = datalog.Tuple;

	var isAggregated = false;
	var isGrounded = false;

	datalog.Tuple.prototype.addTerm = function(term){
		this.slots.push(term);
		if(term.isVar){
			isGrounded = false;
		} else if(term.isAggregate){
			isAggregated = true;
		}
	};

	datalog.Tuple.prototype.predicateSymbol = function(){
		return this.slots.length > 1 ? this.slots[0] : null;
	}

	datalog.Tuple.prototype.arity = function(){
		return this.slots.length - 1;
	};

	datalog.Tuple.prototype.isAggregated = function(){
		return isAggregated;
	}

	datalog.Tuple.prototype.isGrounded = function(){
		return isGrounded;
	}

	datalog.Tuple.prototype.predicateId = function(){
		return this.slots[0] + "/" + (this.slots.length - 1);
	}

	datalog.Tuple.prototype.copy = function(){
		var rv = new Tuple();
		for(var i=0;i<this.slots.length;i++){
			rv.addTerm(this.slots[i]);
		}
		return rv;
	}

	//Tuple.prototype.unify = function(that){
	//	var subst = new Substitution(this, that);
	//	if(subst.compute()){
	//		return subst;
	//	}
	//	return null;
	//}

	datalog.Tuple.prototype.ground = function(substitution){
		console.log(this.toString() + "/" + substitution.toString());
		var retval = new Tuple();
		for(var i in this.slots){
			var term = this.slots[i];
			//console.log("copy " + util.inspect(term));
			if(term.isVar){
				retval.slots.push(substitution.lookup(term));
			} else {
				retval.slots.push(term);
			}
		}
		return retval;
	}

	datalog.Tuple.prototype.renamedCopy = function(suffix){
		var retval = new datalog.Tuple();
		for(var i in this.slots){
			var term = this.slots[i];
			if(term.isVar){
				retval.slots.push(Term.variable(term.symbol + suffix));
			} else {
				retval.slots.push(term);
			}
		}
		return retval;
	}

	datalog.Tuple.prototype.toString = function(){
		var retval = "";
		var last = this.slots.length - 1;
		this.slots.forEach(function(slot, ix){
			if(ix == 0){
				retval += slot + "(";
			} else {
				retval += slot.symbol;
				if(ix < last){
					retval += ","
				}
			}
		});
		return retval + ")";
	}

}());

(function(){

	var Tuple = datalog.Tuple;

	datalog.Aggregation = function(aggs){
		this.aggs = aggs;
		this.root = aggs[0].create();
	};

	datalog.Aggregation.prototype.merge = function(solution){
		var slot = this.root;
		this.predicateSymbol = solution.predicateSymbol();
		for(var i=1;i<solution.slots.length;i++){
			var value = solution.slots[i];

			//Slots include the pred sym, the aggs dont.
			//So the indices go into "the next" factory but "the current" slot

			var nextFactory = false;
			if(i < this.aggs.length){
				nextFactory = this.aggs[i];
			} else {
				nextFactory = {create:function(){return null;}};
			}
			if(!slot.merge){
				console.log("BAD SLOT at: " + i + " :" + util.inspect(slot));
			}
			slot = slot.merge(value, nextFactory);
		}
	};

	datalog.Aggregation.prototype.emitSolutions = function(callback){
		//console.log("EmitSolut");
		this.root.report(new Tuple(this.predicateSymbol), callback);
	}

})();



(function(){

	var Term = datalog.Term;

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

	datalog.Aggregator = function(name){
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

	datalog.Aggregator.prototype.merge = function(term, nextFactory){
		console.log("Aggregator.merge");
		this.acc = this.func(this.acc, term.value());
		if(!this.next){
			this.next = nextFactory.create();
		}
		return this.next;
	}


	datalog.Aggregator.prototype.report = function(tuple, callback){
		console.log("REPORT Aggregator " + this);
		tuple.addTerm(Term.constant(this.acc));
		if(this.next){
			this.next.report(tuple, callback);
		} else {
			console.log("EMITTING SOLUTION " + tuple);
			callback(tuple);
		}
	}
})();
(function(){
  datalog.Factory = function(){
    if(arguments.length < 1){
      throw "Factory needs parameters";
    }
    this.ctor = arguments[0];
    console.log(arguments);
    this.args = [];
    for(var i=1;i<arguments.length;i++){
        this.args[i-1] = arguments[i];
    }
  };

  datalog.Factory.prototype.create = function(){
    console.log(this);
    var Ctor = this.ctor;
    return new Ctor(this.args);
  }
})();
datalog.Predicate = (function(){
		
	function Cycle(predid){
		this.predid = predid;
		this.steps = [];
		this.closed = false;
	}
	Cycle.prototype.errorMessage = function(){
		var rv = "A cyclical dependency prevents stratification:" + this.predid;
		for(var i in steps){
			rv += " -> " + steps[i];
		}
		return rv;
	}
	
	function Arc(predicateId){
		this.predicateId = predicateId;
		this.isCrossStrata = false;
	}
	Arc.prototype.updateCrossStrata = function(isCrossStrata){
		this.isCrossStrata = this.isCrossStrata || isCrossStrata;
	}
	Arc.prototype.lowerBoundIncrease = function(){
		return this.isCrossStrata ? 1 : 0;
	}
	
	function Predicate(predid, lookup){
		this.predid = predid;
		this.pending = false;
		this.lobo = 0;

		//Path to body predicates
		this.arcs = {};
		
		//Locate predicate objects by id
		this.lookup = lookup;
		
		//Heads of rules of this predicate
		this.rules = [];
	}
		
	Predicate.prototype.addRule = function(rule){
	
		rule.body.forEach(function(bodypart){
			var isCrossStrata = rule.head.isAggregated() || bodypart.isNegated;
			var predid = bodypart.predicateId();
			var arc = this.arcs[predid];
			if(arc == null){
				arc = new Arc(predid);
				this.arcs[predid] = arc;
			}
			arc.updateCrossStrata(isCrossStrata);
		}, this);
		
		this.rules.push(rule);
		
	}
	
	Predicate.prototype.checkForCrossStrataCycle = function(lobo){
		//Loop check
		if(this.pending){
			//ok, reentrant. Validate bounds 
			if(lobo > this.lobo){
				//Mark as bad cycle, 
				return new Cycle(this.predid);
			} 
			return null;
		}
		
		this.lobo = lobo;
		
		this.pending = true;
		
		var rv = null;
		for(var predid in this.arcs){
			var arc = this.arcs[predid];
			var pred = this.lookup(arc.predicateId);
			var cycle = pred.checkForCrossStrataCycle(lobo + arc.lowerBoundIncrease());
			if(cycle != null){
				if(cycle.predid == this.predid){
					cycle.closed = true;
				} else if(!cycle.closed){
					cycle.steps.push(this.predid);
				}
				rv = cycle;
			}			
		}
		this.pending = false;
		
		return rv;
	}

	return Predicate;
	
}());
datalog.Substitution = (function(){

	var Substitution = function(parent){//a, b){
		//this.a = a;
		//this.b = b;
		this.eq = {};
		if(parent && parent.eq){
			this.eq.__proto__ = parent.eq;
		}
		//this.inner = {};
		//this.outer = {};
	};

	// This is done to balance the trees for when several variables are
	// unified before unifying with a constant.
	//function unify(t1, t2){
	//	console.log("This is " + this + " in unify");
	//	if(Math.random() > 0.5){
	//		unify2.call(this, t1, t2);
	//	} else {
	//		unify2.call(this, t2, t1);
	//	}
	//}

	function unify(term1, term2){
		//console.log("UNIFY:" + insp(term1) + " = " + insp(term2));

		var repr1 = this.lookup(term1);
		var repr2 = this.lookup(term2);

		//console.log("REPR:" + repr1 + " , " + repr2);

		if(repr1.isVar){
			if(repr2.isVar){
				//Both vars
				//bind outer var to inner
				//but keep intermediate values until constant
				this.bind(repr1, repr2);
			} else {
				//inner is constant
				//bind outer to this
				//also all steps
				this.bind(term1, repr2);
			}
		} else {
			//outer is constant
			if(repr2.isVar){
				//bind inner to outer
				this.bind(term2, repr1);
			} else {
				if(repr1.symbol == repr2.symbol){
					//nothing to do
				} else {
					//fail this branch
					return false;
				}
			}
		}
		return true;
	}

	Substitution.prototype.bind = function(key, value){
		//console.log(this.toString() + " += {" + key + "=>" + value + "}");
		var walker = key;
		while(walker){
			var oldvalue = this.eq[walker.symbol];
			if(walker.symbol != value.symbol){
				this.eq[walker.symbol] = value;
			}
			walker = oldvalue;
		}
	}

	Substitution.prototype.lookup = function(term){
		//console.log("lookup " + term + " in " + insp(this,false,3) + "(" + this.toString() + ")");
		var parent = null;
		while(parent = this.eq[term.symbol]){
			//console.log("passes " + term + " and ");
			term = parent;
		}
		//console.log("returns " + term);
		return term;
	}

	Substitution.prototype.merge = function(outer, inner){

		//console.log("Merge " + outer + " , " + inner);

		var arity = outer.arity();
		if(arity != inner.arity()){
			return false;
		}

		/*function slot(term, isSuppliedInInvocation){
			return {
				symbol: term.symbol,
				isVar: term.isVar,
				isSuppliedInInvocation: isSuppliedInInvocation,
				//key is like symbol, only changed a bit to make
				//the Xs in p(X, Y)? and p(Y, X):-q(Y, X). differ
				key: isSuppliedInInvocation && term.isVar ? term.symbol + "?" : term.symbol,
				toString: function(){
					return (term.isVar ? '_' : '')
						 + term.symbol
						 + (term.isVar && isSuppliedInInvocation ? "?" : "");
				}
			};
		}*/

		for(var i=0;i<arity;i++){
			var ai = outer.slots[i+1];
			var bi = inner.slots[i+1];
			if(!unify.call(this, ai, bi)){
				return false;
			}
		}
		//console.log("Merged " + outer + " , " + inner + " in " + this.toString());
		return true;
	}

	Substitution.prototype.toString = function(){
		function enumerate(obj, sink){
			for(var prop in obj){
				if(prop == 'prototype'){
					enumerate(obj[prop], sink);
				} else {
					sink.push({key:prop, value:obj[prop]});
				}
			}
		}

		var keys = [];
		enumerate(this.eq, keys);

		var retval = null;
		for(var i=0;i<keys.length;i++){
			if(retval){
				retval += ", ";
			} else {
				retval = "{";
			}
			retval += keys[i].key + " -> " + keys[i].value;
		}
		return retval ? retval + "}" : "{}";
	}

	return Substitution;
})();


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
			//var goal = new Goal(goals[ix].head, this);
			var goal = new Goal(goals[ix], this);
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


(function(){

	var Term = datalog.Term;

	datalog.Grouping = function(){
		this.values = {};
		this.next = null;
	};

	datalog.Grouping.prototype.merge = function(term, nextFactory){
		console.log("Grouping.merge");
		var next = this.values[term.symbol];
		if(!next){
			next = nextFactory.create();
			this.values[term.symbol] = next;
		}
		return next;
	}

	datalog.Grouping.prototype.report = function(terms, callback){
		console.log("REPORT Grouping " + this);
		for(var value in this.values){
			var termsCopy = terms.copy();
			termsCopy.addTerm(Term.constant(value));
			var next = this.values[value];
			if(next){
				next.report(termsCopy, callback);
			} else {
				//console.log("EMITTING SOLUTION [" + util.inspect(termsCopy) + "]");
				callback(termsCopy);
			}
		}
	}

	//Grouping.prototype.toString = function(){
	//	return util.inspect(this);
	//}
})();


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
datalog.Lexer = (function(){

	var Lexer = function(input){
		this.left = input;
		this.line = 0;
	};

	Lexer.LPAR = 'LPAR';
	Lexer.RPAR = 'RPAR';
	Lexer.COMMA = 'COMMA';
	Lexer.IF = 'IF';
	Lexer.NAME = 'NAME';
	Lexer.VARIABLE = 'VARIABLE';
	Lexer.NUMBER = 'NUMBER';
	Lexer.WHITE = 'WHITE';
	Lexer.DOT = 'DOT';
	Lexer.QUESTION = 'QUESTION';
	Lexer.COMMENT = 'COMMENT';

	Lexer.NOMATCH = 'NOMATCH';

	var tokenTypes = [
	    {regex: /^\(/, type:Lexer.LPAR},
	    {regex: /^\)/, type:Lexer.RPAR},
	    {regex: /^,/, type:Lexer.COMMA},
	    {regex: /^\:\-/, type:Lexer.IF},
	    {regex: /^[a-z]\w*/, type:Lexer.NAME},
	    {regex: /^[A-Z]\w*/, type:Lexer.VARIABLE},
	    {regex: /^\d+/, type:Lexer.NUMBER},
  		{regex: /^\s+/, type:Lexer.WHITE},
  		{regex: /^\./, type:Lexer.DOT},
  		{regex: /^\?/, type:Lexer.QUESTION},
  		{regex: /^#.*\n/, type:Lexer.COMMENT}
	];

	Lexer.prototype.countLines = function(token){
		for(var i=0;i<token.length;i++){
			if(token.charAt(i) == "\n"){
				this.line++;
			}
		}
	}

	function Token(){
		this.text = null;
		this.line = null;
		this.type = Lexer.NOMATCH;
	}

	Lexer.prototype.hasMoreInput = function(){
		return this.left.length > 0;
	}

	Lexer.prototype.nextToken = function(){
		var token = new Token();
		token.line = this.line;
		for(var i in tokenTypes){
			var tokenType = tokenTypes[i];
			var match = this.left.match(tokenType.regex);
			if(match){
				//console.log("match:[" + match + "] in [" + this.left + "] as [" + tokenType.type + "]");

				token.text = match[0];
				token.type = tokenType.type;

				this.left = this.left.substring(token.text.length);
				if(tokenType.type == Lexer.WHITE){
					this.countLines(token.text);
				}

				return token;
			}
		}
		if(token.type == Lexer.NOMATCH){
			token.text = this.left.substring(0, Math.min(this.left.length, 20));
		}
		return token;
	}

	return Lexer;

})();

(function(){

	var Lexer = datalog.Lexer;
	var Rule = datalog.Rule;
	var Term = datalog.Term;
	
	datalog.Parser = function(){
		this.ruleListeners = [];
		this.syntaxErrorListeners = [];
		this.successListeners = [];
		this.rule = null;
	};

	datalog.Parser.prototype.emitRule = function(rule){
		this.ruleListeners.forEach(function(listener){
			listener(rule);
		});
	}

	datalog.Parser.prototype.emitSyntaxError = function(syntaxError){
		this.syntaxErrorListeners.forEach(function(listener){
			listener(syntaxError);
		});
	}
	datalog.Parser.prototype.emitSuccess = function(success){
		this.successListeners.forEach(function(listener){
			listener(success);
		});
	}
	datalog.Parser.prototype.on = function(event, listener){
		if(event == 'rule'){
			this.ruleListeners.push(listener);
		} else if(event == 'syntaxError'){
			this.syntaxErrorListeners.push(listener);
		} else if(event == 'success'){
			this.successListeners.push(listener);
		} else {
			throw "Unsupported event type [" + event+ "]";
		}
		return this;
	}
	
	datalog.Parser.prototype.beforeRule = function(token){
		if(token.type == Lexer.NAME){
			this.rule = new Rule(token.text);
			return this.afterHeadPredicate
		} else if(token.type == Lexer.WHITE){
			return this.beforeRule;
		} else if(token.type == Lexer.COMMENT){
			return this.beforeRule;
		} else {
			this.emitSyntaxError("Expected token at line [" +
								 token.line + "], got [" + token.text + "]");
			return null;
		}
	}
	
	datalog.Parser.prototype.afterHeadPredicate = function(token){
		if(token.type == Lexer.LPAR){
			return this.expectHeadParam;
		} else if(token.type == Lexer.WHITE){
			return this.afterHeadPredicate;
		} else {
			this.emitSyntaxError("Expected '(' at line " + token.line);
			return null;
		}
	}
	
	datalog.Parser.prototype.expectHeadParam = function(token){
		if(token.type == Lexer.NAME){
			this.paramOrAggregate = token.text;
			return this.expectHeadVarOrParamCompletion;
		} else if(token.type == Lexer.WHITE){
			return this.expectHeadParam;
		} else if(token.type == Lexer.NUMBER){
			this.rule.head.addTerm(Term.constant(token.text));
			return this.expectHeadParamCompletion;
		} else if(token.type == Lexer.VARIABLE){
			this.rule.head.addTerm(Term.variable(token.text));
			this.paramOrAggregate = null;
			return this.expectHeadParamCompletion;
		} else {
			this.emitSyntaxError("Expected NAME at line " + token.line);
			return null;
		}
	}
	
	datalog.Parser.prototype.expectHeadParamCompletion = function(token){
		if(token.type == Lexer.WHITE){
			return this.expectHeadParamCompletion;
		}
		if(token.type == Lexer.COMMA){
			return this.expectHeadParam;
		} else if(token.type == Lexer.RPAR){
			return this.afterHead; 
		}
	}
	
	datalog.Parser.prototype.expectHeadVarOrParamCompletion = function(token){
		if(token.type == Lexer.WHITE){
			return this.expectHeadVarOrParamCompletion;
		}
		if(!this.paramOrAggregate){
			throw "Bad state assumption, paramOrAggregate not set";
		}
		if(token.type == Lexer.COMMA){
			this.rule.head.addTerm(Term.constant(this.paramOrAggregate));
			this.paramOrAggregate = null;
			return this.expectHeadParam;
		} else if(token.type == Lexer.VARIABLE){
			this.rule.head.addTerm(Term.aggregator(token.text, this.paramOrAggregate));
			this.paramOrAggregate = null;
			return this.expectHeadParamCompletion;
		} else if(token.type == Lexer.RPAR){
			this.rule.head.addTerm(Term.constant(this.paramOrAggregate));
			this.paramOrAggregate = null;
			return this.afterHead; 
		}
	}
	
	datalog.Parser.prototype.afterHead = function(token){
		if(token.type == Lexer.DOT){
			this.emitRule(this.rule);
			this.rule = null;
			return this.beforeRule;
		} else if(token.type == Lexer.WHITE){
			return this.afterHead;
		} else if(token.type == Lexer.IF){
			return this.beforeSubGoal;
		} else {
			this.emitSyntaxError("Expected [.] or [:-] at line ["+token.line+"], not [" + token.text + "]");
		}
	}
	
	datalog.Parser.prototype.beforeSubGoal = function(token){
		if(token.type == Lexer.WHITE){
			return this.beforeSubGoal;
		} else if (token.type == Lexer.NAME){
			this.rule.addSubGoal(token.text);
			return this.afterBodyPredicate;
		} 
	}
	
	datalog.Parser.prototype.afterBodyPredicate = function(token){
		if(token.type == Lexer.LPAR){
			return this.expectBodyParam;
		} else if(token.type == Lexer.WHITE){
			return this.afterBodyPredicate;
		} else {
			this.emitSyntaxError("Expected '(' at line " + token.line);
			return null;
		}
	}
	
	datalog.Parser.prototype.expectBodyParam = function(token){
		if(token.type == Lexer.NAME){
			this.rule.lastSubGoal().addTerm(Term.constant(token.text));
			return this.expectBodyParamCompletion;
		} else if(token.type == Lexer.WHITE){
			return this.expectBodyParam;
		} else if(token.type == Lexer.NUMBER){
			this.rule.lastSubGoal().addTerm(Term.number(token.text));
			return this.expectBodyParamCompletion;
		} else if(token.type == Lexer.VARIABLE){
			this.rule.lastSubGoal().addTerm(Term.variable(token.text));
			return this.expectBodyParamCompletion;
		} else if(token.type == Lexer.RPAR){
			return afterSubGoal;
		}
	}
	
	datalog.Parser.prototype.expectBodyParamCompletion = function(token){
		if(token.type == Lexer.WHITE){
			return this.expectBodyParamCompletion;
		}
		if(token.type == Lexer.COMMA){
			return this.expectBodyParam;
		} else if(token.type == Lexer.RPAR){
			return this.afterSubGoal; 
		}
	}
	
	datalog.Parser.prototype.afterSubGoal = function(token){
		if(token.type == Lexer.DOT){
			this.emitRule(this.rule);
			this.rule = null;
			return this.beforeRule;
		} else if(token.type == Lexer.WHITE){
			return this.afterSubGoal;
		} else if(token.type == Lexer.COMMA){
			return this.beforeSubGoal;
		} else {
			this.emitSyntaxError("Expected [.] or [,] at line ["+token.line+"], not [" + token.text + "]");
		}
	}
	
	datalog.Parser.prototype.parse = function(string){
		var lexer = new Lexer(string);
		var state = this.beforeRule;
		while(lexer.hasMoreInput()){
			var token = lexer.nextToken();
			//console.log("state: " + state);
			var newstate = state.call(this, token); 
			if(!newstate){
				throw "Bad state transition on token.type == "+token.type+" from state " + state; 
				break;
			}
			state = newstate;
		}
		this.emitSuccess("Parser reached EOF without error");
	}	
})();