var LevelCompiler = require('./compiler');

var LevelSession = module.exports = function(collectionMap, cache) {
  this.collectionMap = collectionMap;
  this.cache = cache || {};
};

function convertToModel(config, entity, isBare) {
  return entity;
  /*var obj;
  if (isBare) {
    obj = entity;
  } else {
    obj = Object.create(config.constructor.prototype);
    var keys = Object.keys(config.fieldMap || {});
    keys.forEach(function(key) {
      var prop = config.fieldMap[key] || key;
      if (key.indexOf('.') === -1) {
        obj[key] = entity[prop];
      } else {
        var parts = prop.split('.');
        var part = parts.reduce(function(prev, cur) {
          if (Array.isArray(prev)) {
            return prev.map(function(item) {
              return item[cur];
            }); 
          } else if (prev.hasOwnProperty(cur)) {
            return prev[cur];
          }
        }, entity)

        obj[key] = part;
      }
    });
  }

  return obj;*/
}

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
      var entities = sorted.map(function(value) {
        return convertToModel(query.modelConfig, value, query.modelConfig.isBare);
      });

      cb(null, entities);
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

    var model = convertToModel(config, value, config.isBare);
    cb(null, model);
  });
};

LevelSession.create = function(options) {
  return new LevelSession(options);
};
