var LevelCompiler = require('./compiler');

var LevelSession = module.exports = function(collectionMap, cache) {
  this.collectionMap = collectionMap;
  this.cache = cache || {};
};

function convertToModel(config, entity, isBare) {
  var obj;
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

  return obj;
}

LevelSession.prototype.match = function(query, value) {
  var compiler = new LevelCompiler(this.cache);
  var compiled = compiler.compile(query.build(), query.modelConfig);
  return this._match(query, compiled, value);
};

LevelSession.prototype._match = function(query, compiled, value) {
  if (result = compiled.filterOne(value)) {
    if (query.modelConfig.constructor)
    {
      if (compiled.fields.length > 0 && (compiled.fields[0].name !== '*' || compiled.fields[0] !== '*')) {
        return result;
      } else {
        return convertToModel(query.modelConfig, result, false);
      }
    } else {
      return result;
    }
  }

  return null;
};


LevelSession.prototype.find = function(query, cb) {
  var self = this;
  if (typeof query === 'function') {
    cb = query;
    query = null;
  }

  var collection = query.modelConfig.collection;
  var db = this.collectionMap[collection];

  var compiler = new LevelCompiler(this.cache);
  var compiled = compiler.compile(query.build(), query.modelConfig);

  var buffer = [];

  db.createReadStream({ valueEncoding: 'json' })
    .on('data', function(data) {
      if(result = self._match(query, compiled, data.value)) {
        result.__calypsoKey = data.key;
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

  db.get(id, { valueEncoding: 'json' }, function(err, value) {
    if (err) {
      cb(err);
      return;
    }

    cb(null, convertToModel(config, value, config.isBare));
  });
};

LevelSession.create = function(options) {
  return new LevelSession(options);
};
