var JSCompiler = require('caql-js-compiler');

var LevelCompiler = module.exports = function(cache) {
  this.cache = cache;

  this.compiler = new JSCompiler();
};

LevelCompiler.prototype.compile = function(query, modelConfig) {
  this.compiler.params = query.value.params;

  this.compiler.fieldMap = modelConfig.fieldMap;

  if (query.type === 'ast') {
    query.value.accept(this.compiler);
  } else if (query.type === 'ql') {
    var ql = query.value.ql;
    var ast;
    if (this.cache.hasOwnProperty(ql)) {
      ast = this.cache[ql];
    } else {
      ast = this.compiler.compile(ql);
      this.cache[ql] = ast;
    }
  }

  return this.compiler;
};
