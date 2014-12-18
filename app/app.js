var express = require('express');
var bodyParser = require('body-parser');

var app = module.exports.app = exports.app = express();

// Middleware for parsing request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(require('connect-livereload')());

// Serve our static angular and HTML files from this directory
app.use(express.static(__dirname));
