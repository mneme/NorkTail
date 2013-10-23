Work in progress.

usage:
var Tail = require('nork-tail');

Takes two arguments. path to a directory and a regexp for filtering file-names.

var w = Tail('./tmp');

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