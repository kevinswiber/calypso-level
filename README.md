# calypso-level

A LevelDB driver for [calypso](https://github.com/kevinswiber/calypso).

## Install

`npm install calypso-level`

## Example

With query language:

```js
var calypso = require('calypso');
var level = require('levelup');
var LevelDriver = require('calypso-level');
var Query = calypso.Query;

var driver = LevelDriver.create({
  collectionMap: {
    'companies': level('./db')
  }
});

var engine = calypso.configure({
  driver: driver
});

engine.build(function(err, connection) {
  var session = connection.createSession();

  var query = Query.of('companies')
    .ql('SELECT name, founded_year, total_money_raised AS worth ' +
        'WHERE founded_year >= @year AND name NOT LIKE @term ' +
        'ORDER BY founded_year DESC, name')
    .params({ year: 1999, term: '%air%' });

  session.find(query, function(err, companies) {
    console.log(companies);
    connection.close();
  });
});
```

With object mapping:

```js
var calypso = require('calypso');
var level = require('levelup');
var LevelDriver = require('calypso-level');
var Query = calypso.Query;

var Company = function() {
  this.name = null;
  this.foundedYear = null;
  this.worth = null;
};

var mapping = function(config) {
  config
    .of(Company)
    .at('companies')
    .map('name')
    .map('foundedYear', { to: 'founded_year' })
    .map('worth', { to: 'total_money_raised' });
};

var driver = LevelDriver.create({
  collectionMap: {
    'companies': level('./db')
  }
});

var engine = calypso.configure({
  driver: driver,
  mappings: [mapping]
});

engine.build(function(err, connection) {
  var session = connection.createSession();

  var query = Query.of(Company)
    .where('foundedYear', { gte: 1999 })
    .and('name', { not: { like: '%air' } })
    .orderBy({ foundedYear: 'desc' }, 'name');

  session.find(query, function(err, companies) {
    console.log(companies);
  });
});
```

## License

MIT
