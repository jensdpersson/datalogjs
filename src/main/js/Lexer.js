module.exports = (function(){

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
