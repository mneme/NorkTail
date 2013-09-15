var StateHandler = function(){}

/*
 * Handle current read position in watched files.
 */
StateHandler.prototype.get = function(filename){
  return this['#'+filename];
}

StateHandler.prototype.set = function(filename, start){
  this['#'+filename] = start;
}

StateHandler.prototype.remove = function(filename){
  delete this['#'+filename];
}

module.exports = StateHandler;