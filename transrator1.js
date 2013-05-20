#!/usr/local/bin/node

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var util = require('util');
var parser = require('./actor1');


var argv = process.argv;
fs.readFile(argv[2], 'utf8',
	function (err, input) {
		var tree = parser.parse(input, 'start');
		util.print(JSON.stringify(tree, null, 2));
	});
