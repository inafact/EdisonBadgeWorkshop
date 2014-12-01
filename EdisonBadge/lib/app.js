var express = require('express'),
    path = require('path'),
    app = express();

app.use('/', express.static(path.join(__dirname, 'public'))); // served static contents only

app.set('port', process.env.PORT || 8080);

module.exports = app;
