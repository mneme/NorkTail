var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    fs = require('fs'),
    path = require('path'),
    Hash = require('nork-hash'),
    h = require('./helpers');

Watcher = function(file, delimiter){
  this.delimiter = delimiter;
  this.dirname = path.dirname(file);
  this.filter = path.basename(file) === '*' ? '' : path.basename(file);
  this.queue = [];
}

util.inherits(Watcher, EventEmitter);

/*
 * Public methods.
 */ 
Watcher.prototype.start = function() {
  if(this.watcher){return this;}
  return this.init();
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
  if(this.filter && this.filter != filename){return;}
  this[event](filename);
}

Watcher.prototype.tail = function(filename,start,end) {
  var self = this;
  h.readFile(fullPath(filename), start, end, function(err, data){
    if(err){return self.emit('error', err);}
    data.split(this.delimiter).forEach(function(item){
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
      self.fileState.put(filename, stat.size);
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
  fs.stat(this.fullPath(filename), function(err, stat){
    if (!stat){return;}
      
    if(stat.size > self.fileState.get(filename)){
      self.tail(this.fullPath(filename), self.fileState.get(filename), stat.size);
    }
    self.fileState.put(filename, stat.size);
  });
}

/*
 * Expose
 */
module.exports = function(file, delimiter){
  return new Watcher(file,delimiter)
}