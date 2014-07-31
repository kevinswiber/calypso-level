var LevelCompiler = require('./compiler');

var LevelSession = module.exports = function(collectionMap, cache) {
  this.collectionMap = collectionMap;
  this.cache = cache || {};
};

LevelSession.prototype.find = function(query, cb) {
  if (typeof query === 'function') {
    cb = query;
    query = null;
  }

  if (!query) {
    query = 'select *';
  }

  var collection = query.modelConfig.collection;
  var db = this.collectionMap[collection];

  var compiler = new LevelCompiler(this.cache);
  var compiled = compiler.compile(query.build(), query.modelConfig);

  var buffer = [];

  db.createReadStream({ valueEncoding: 'json' })
    .on('data', function(data) {
      if (result = compiled.filterOne(data.value)) {
        buffer.push(result);
      }
    })
    .on('end', function() {
      var sorted = compiled.sort(buffer);

      cb(null, sorted);
    })
    .on('error', function(err) {
      cb(err);
    });
};

LevelSession.prototype.get = function(query, id, cb) {
  var collection = query.modelConfig.collection;
  var db = this.collectionMap[collection];

  var config = query.modelConfig;

  db.get(id, function(err, value) {
    if (err) {
      cb(err);
      return;
    }

    cb(null, value);
  });
};

LevelSession.create = function(options) {
  return new LevelSession(options);
};
