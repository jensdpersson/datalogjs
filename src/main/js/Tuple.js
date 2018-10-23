
var Term = require('./Term');
var Substitution = require('./Substitution');
//var util = require('util');

module.exports = (function(){

	var Tuple = function(predicateSymbol){
		this.isNegated = false;
		this.slots = [];
		if(predicateSymbol){
			this.slots.push(predicateSymbol);
		}
	};

	var isAggregated = false;
	var isGrounded = false;

	Tuple.prototype.addTerm = function(term){
		this.slots.push(term);
		if(term.isVar){
			isGrounded = false;
		} else if(term.isAggregate){
			isAggregated = true;
		}
	};

	Tuple.prototype.predicateSymbol = function(){
		return this.slots.length > 1 ? this.slots[0] : null;
	}

	Tuple.prototype.arity = function(){
		return this.slots.length - 1;
	};

	Tuple.prototype.isAggregated = function(){
		return isAggregated;
	}

	Tuple.prototype.isGrounded = function(){
		return isGrounded;
	}

	Tuple.prototype.predicateId = function(){
		return this.slots[0] + "/" + (this.slots.length - 1);
	}

	Tuple.prototype.copy = function(){
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

	Tuple.prototype.ground = function(substitution){
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

	Tuple.prototype.renamedCopy = function(suffix){
		var retval = new Tuple();
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

	Tuple.prototype.toString = function(){
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

	return Tuple;
}());
