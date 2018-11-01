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
