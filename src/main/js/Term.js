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
	
	Term.create = function(symbol) {
	    let isVar = /^[A-Z]+/.test(symbol);
	    return new Term(symbol, isVar);
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