

DATALOG.JS
==========

This package provides an implementation of stratified Datalog with negation and aggregation.

Datalog?
--------
Datalog is a logic programming language descended from Prolog.
The core datalog language is not Turing complete but can (therefore) boast 
properties of termination within polynomial time.  

A Datalog Program consists of Rules and Facts. A fact is a statement of the form

Predicate(Term, ... ,Term).

A Rule is a statement of the form

Predicate(Term, ... ,Term) :- 
   Predicate(Term, ..., Term), 
   ...
   Predicate(Term, ..., Term).

Negation?
---------
Core datalog does not allow for checking that a predicate does not hold for some terms.
Datalog with negation does.

Aggregation?
------------
Core datalog has no notion of projections or aggregations like counting all terms for which a predicate holds and similar. Datalog with aggregation adds a mechanism for this. 

Stratified!
-----------
To keep the promise of no infinite loops and a timely termination even with negation and aggregation added some mechanism is needed. This is stratification. Essentially, when predicates reference an aggregation or negation of another predicate then that other must belong to a lower stratum (like a phase). They cannot then reference each other in a way that would break the basic promises.

  
 Usage
 -------
 
 ```javascript
 //The program collects rules and calculates results.

 var program = new datalog.Program();

//The parser converts datalog source text to rules usable by the Theory.

var parser = new datalog.Parser();

// Parser emits some events when parsing 

parser.on('rule', function(rule){
	program.addRule(rule);
});

parser.on('syntaxError', function(error){
    console.log(error);
});

parser.on('success', function(){
    //Now we can query
    
});
```
 

 
