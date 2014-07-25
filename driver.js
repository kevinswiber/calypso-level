var Connection = require('./connection');

var JSDriver = module.exports = function(options) {
  this.options = options;
};

JSDriver.prototype.init = function(cb) {
  var connection = Connection.create(this.options);
  connection.init(cb);
};

JSDriver.create = function(options, cb) {
  var driver = new JSDriver(options);
  return driver;
};
