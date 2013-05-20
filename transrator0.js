#!/usr/local/bin/node

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var util = require('util');
var parser = require('./actor0');


var undefined_array_size = 5;
var getEnv = function() {
	var H = {
		Block: function (t, env) {
			getEnv(t.statements, env);
		},
		ActorDeclaration: function (t, env) {
			var name = t.name;
			var basic = { fields: {}, methods: {} };
			var environments = {
				basic: basic,
				rename_tree: { actor_name: name.toUpperCase(), fields_name: [], methods: [] }
			};
			getEnv(t.elements, environments);
			env.basic_info[name] = basic;
			env.actor_name_list.push(name);
			env.rename_actor_tree.push(environments.rename_tree);
		},
		VariableStatement: function (t, env) {
			var fields = env.basic.fields;
			var environments = { fields: [t.type_specifier, fields], rename_tree: env.rename_tree };
			getEnv(t.declarations, environments);
		},
		PointerDeclaration: function (t, env) {
			var name = t.name;
			env.fields[1][name] = {type: env.fields[0], is_pointer: true, is_array: false, size: 1};
			env.rename_tree.fields_name.push(env.rename_tree.actor_name + "_" + name.toUpperCase());
		},
		ArrayDeclaration: function (t, env) {
			var name = t.name;
			var size = t.array_size-0;
			env.fields[1][name] = {type: env.fields[0], is_pointer: false, is_array: true, size: size};
			var actor_name = env.rename_tree.actor_name;
			for (var i = 0; i < size; i ++)
				env.rename_tree.fields_name.push(actor_name + "_" + name.toUpperCase() + i);
		},
		VariableDeclaration: function (t, env) {
			var name = t.name;
			env.fields[1][name] = {type: env.fields[0], is_pointer: false, is_array: false, size: 1};
			env.rename_tree.fields_name.push(env.rename_tree.actor_name + "_" + name.toUpperCase());
		},
		MethodDeclaration: function (t, env) {
			var name = t.name;
			var method = {return_type: t.return_type, params: {}, make_act: {}, make_msg: {}};
			var rename_method = {name: env.rename_tree.actor_name + "_" + name.toUpperCase(), arguments: []};
			var environments = {method_params: method.params, rename_method: rename_method};
			getEnv(t.params, environments);
			env.basic.methods[name] = method;
			env.rename_tree.methods.push(rename_method);
		},
		PointerParameter: function (t, env) {
			var name = t.name;
			var param = {type: t.type_specifier, is_pointer: true, is_array: false, size: 1};
			env.method_params[name] = param;
			env.rename_method.arguments.push(env.rename_method.name + "_" + name.toUpperCase());
		},
		ArrayParameter: function (t, env) {
			var name = t.name;
			var size = t.array_size !== "undefined" ? t.array_size-0 : undefined_array_size;
			var param = {type: t.type_specifier, is_pointer: false, is_array: true, size: size};
			env.method_params[name] = param;
			for (var i = 0; i < size; i ++)
				env.rename_method.arguments.push(env.rename_method.name + "_" + name.toUpperCase() + i);
		},
		VariableParameter: function (t, env) {
			var name = t.name;
			var param = {type: t.type_specifier, is_pointer: false, is_array: true, size: 1};
			env.method_params[name] = param;
			env.rename_method.arguments.push(env.rename_method.name + "_" + name.toUpperCase());
		},
		DestructorDeclaration: function (t, env) {
			var name = t.name;
			var method = {return_type: "void", params: {}, make_act: {}, make_msg: {}};
			var rename_method = {name: env.rename_tree.actor_name + "_" + name.toUpperCase(), arguments: []};
			var environments = {method_params: method.params, rename_method: rename_method};
			getEnv(t.params, environments);
			env.basic.methods[name] = method;
			env.rename_tree.methods.push(rename_method);
		},
		ConstructorDeclaration: function (t, env) {
			var name = t.name;
			var method = {return_type: "void", params: {}, make_act: {}, make_msg: {}};
			var rename_method = {name: env.rename_tree.actor_name + "_" + name.toUpperCase(), arguments: []};
			var environments = {method_params: method.params, rename_method: rename_method};
			getEnv(t.params, environments);
			env.basic.methods[name] = method;
			env.rename_tree.methods.push(rename_method);
		}
	};

	var G = function (t, env) {
		if (Array.isArray(t)) t.forEach(function (t) { getEnv(t, env); });
		else if (typeof(t) === 'object') H[t.type](t, env);
	};

	return G;
}();


var token_maker = function(N) { return '\"' + N + '\" !identifier_part { return \"' + N + '\"; }' };
var codeToFile = function (filename, code) {
	var fd = fs.openSync(filename, 'w');
	fs.writeSync(fd, code);
	fs.closeSync(fd);
}

var argv = process.argv;
fs.readFile(argv[2], 'utf8',
	function (err, input) {
		var tree = parser.parse(input, 'start');

		util.print(JSON.stringify(tree, null, 2));

	   	var environments = {
			basic_info: {},
			actor_name_list: [],
			rename_actor_tree: []
		}
		getEnv(tree, environments);

		util.print(JSON.stringify(environments.basic_info, null, 2));
		util.print(JSON.stringify(environments.actor_name_list, null, 2));
		util.print(JSON.stringify(environments.rename_actor_tree, null, 2));
		
		var pegjs_code = './add1_b.pegjs';
		var actor_token = ["actor_name_token", "\n    = "];
		environments.actor_name_list.forEach(
			function (t) {
		   	actor_token.push(token_maker(t)); 
			actor_token.push("\n    / ");
		});
		actor_token.pop();
		codeToFile(pegjs_code, actor_token.join(""));
	   
	});
