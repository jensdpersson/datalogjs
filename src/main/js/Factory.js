module.exports = (function(){
  var Factory = function(){
    if(arguments.length < 1){
      throw "Factory needs parameters";
    }
    this.ctor = arguments[0];
    this.args = [];
    for(var i=1;i<arguments.length;i++){
        this.args[i-1] = arguments[i];
    }
  };

  Factory.prototype.create = function(){
    var Ctor = this.ctor;
    return new Ctor(this.args);
  }

  return Factory;
})();
