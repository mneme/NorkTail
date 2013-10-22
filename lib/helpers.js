var fs = require('fs');

module.exports.readFile = function(file, start, end, cb){
  var data = '';

  fs.createReadStream(file, {start:start, end:end})
    .on('error', function(err){
      cb(err, null)
    })
    .on('data', function(chunk, size) {
      data += chunk;
    })
    .on('end', function() {
      cb(null, data);
    });
}

module.exports.getFiles = function(filter, dir, cb){
  fs.readdir(dir, function(err, files){
    if(err) return cb(err, null);
    
    if(filter){
      files.filter(function(file){
        return file.match(filter)
      });
    }
    
    cb(null, files);
  });
}

module.exports.sync = function(array, when, then){
  var head = array.shift();
  if(head)
    when(head, module.exports.sync.bind(this, array, when, then));
  else
    then();
}