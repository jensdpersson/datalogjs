
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