module.exports = (function(){
		
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