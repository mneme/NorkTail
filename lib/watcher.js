var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    fs = require('fs'),
    path = require('path'),
    Hash = require('nork-hash'),
    h = require('./helpers');

Watcher = function(dir, options){
  var options = options || {};
  this.delimiter = options.delimiter || /\r?\n/;
  this.dirname = dir;
  this.filter = this.parseFilter(options.filter || null);
  this.timeouts = new Hash();
}

util.inherits(Watcher, EventEmitter);


Watcher.prototype.parseFilter = function(filter){
  if(!filter){
    return undefined;
  }
  else if(typeof filter === 'string'){
    return new RegExp('^' + filter.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + '$');
  }
  else if(filter instanceof RegExp){
    return filter;
  }
  else{
    throw new Error('typeError');
  }
}

/*
 * Public methods.
 */ 
Watcher.prototype.start = function() {
  if(this.watcher){return this;}
  this.init();
  return this;
}


Watcher.prototype.stop = function() {
  if(!this.watcher){return this;}
  this.watcher.close();
  delete this.watcher;
  this.fileState.clear();
  return this;
}

/*
 * Internal methods
 */
 Watcher.prototype.init = function() {
  this.fileState = new Hash();
  var self = this;

  h.getFiles(self.filter, self.dirname, function(err, files){
    if(err){return self.emit('error', err);}
    h.sync(files,
      function(filename, next){
        self.rename(filename, next);
      },
      function(){
        self.watcher = fs.watch(self.dirname, function(event, filename){
          self.handle(event, filename);
        });
      }
    );
  });
}


Watcher.prototype.handle = function(event, filename){
  if(!filename || (this.filter && filename.match(this.filter))){return;}
  this[event](filename);
}

Watcher.prototype.tail = function(filename,start,end) {
  var self = this;
  h.readFile(self.fullPath(filename), start, end, function(err, data){
    if(err){return self.emit('error', err);}
    
    var split = data.split(self.delimiter)
    split.forEach(function(item){
        self.emit('data', item, filename);
      }); 
  });
};

Watcher.prototype.fullPath = function(filename){
  return path.join(this.dirname, filename)
}

/*
 * fs.watch event handlers
 */
Watcher.prototype.rename = function(filename, cb){
  var self = this;
  fs.stat(self.fullPath(filename), function(err, stat){
    if(stat && stat.isFile()){
      self.fileState.put(filename, {position:stat.size, queue:[]});
      self.emit('watch', filename);
    }
    else if(self.fileState.get(filename)){
      self.fileState.remove(filename);
      self.emit('unwatch', filename);
    }
    return cb && cb()
  });
}


Watcher.prototype.change = function(filename) {
  var self = this;

  clearTimeout(this.timeouts.get(filename)); 
  this.timeouts.put(filename, 
    setTimeout(function(){
      var file = filename;
      
      fs.stat(self.fullPath(file), function(err, stat){
      if (!stat){return;}
        
      if(stat.size > self.fileState.get(file).position){
        self.tail(filename, self.fileState.get(file.position), stat.size);
      }
      self.fileState.get(file).position = stat.size;
    });
    }, 50)
  );
}

/*
 * Expose
 */
module.exports = function(file, delimiter){
  return new Watcher(file,delimiter)
}