var Watcher = require('./lib/watcher');
var path = require('path');

var w = Watcher('./tmp/*');

w
  .on('error', function(err){
    console.log(err);
  })
  .on('data', function(data){
    console.log(data);
  })
  .on('unwatch', function(file){
    console.log('unwatching: ' + file);
  })
  .on('watch', function(file){
    console.log('watching: ' + file);
  })
  .start();