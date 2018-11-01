

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
