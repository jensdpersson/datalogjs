var insp = require('util').inspect;

module.exports = (function(){

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
