
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
