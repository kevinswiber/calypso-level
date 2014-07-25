var Session = require('./session');

var LevelConnection = module.exports = function(options) {
  // { 'dbname': db }
  this.collectionMap = options.collectionMap;
  this.cache = {};
};

LevelConnection.prototype.init = function(cb) {
  var self = this;
  var dbs = Object.keys(self.collectionMap).map(function(key) {
    return self.collectionMap[key];
  });

  var current = 0;

  var open = function() {
    if (current === dbs.length) {
      cb(null, self);
      return;
    }

    var db = dbs[current];

    db.open(function(err) {
      if (err) {
        cb(err);
      } else {
        current++;
        open();
      }
    });
  }

  open();
};

LevelConnection.prototype.createSession = function() {
  return Session.create(this.collectionMap, this.cache);
};

LevelConnection.prototype.close = function(cb) {
  var self = this;
  var dbs = Object.keys(self.collectionMap).map(function(key) {
    return self.collectionMap[key];
  });

  var current = 0;

  var close = function() {
    if (current === dbs.length) {
      if (cb) cb();
      return;
    }

    var db = dbs[current];

    db.close(function(err) {
      if (err) {
        if (cb) cb(err);
      } else {
        current++;
        close();
      }
    });
  }

  close();
  if (cb) cb();
};

LevelConnection.create = function(options) {
  var connection = new LevelConnection(options);
  return connection;
};
