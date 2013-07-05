#!/usr/local/bin/node

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var util = require('util');
var parser = require('./actor0');


var basic_info = {};
var name_list = {}
var actor_name_list = [];
var rename_actor_tree = [];
var headers = [];


var codeToFile = function (filename, code) {
	var fd = fs.openSync(filename, 'w');
	fs.writeSync(fd, code);
	fs.closeSync(fd);
};

var makeDirectory = function (foldername, place) {
	var new_dir = path.join(__dirname, place, foldername);
	try {
		fs.statSync(new_dir);
	} catch (e) {
		fs.mkdirSync(new_dir, 0755);
	}
	return new_dir;
};


var setDataStructure = function(tree) {
	var environments = {
		basic_info: basic_info,
		name_list: name_list,
		actor_name_list: actor_name_list,
		rename_actor_tree: rename_actor_tree
	};
	getData(tree, environments);

	/*
	   util.print(JSON.stringify(environments.basic_info, null, 2));
	   util.print(JSON.stringify(environments.name_list, null, 2));
	   util.print(JSON.stringify(environments.actor_name_list, null, 2));
	   util.print(JSON.stringify(environments.rename_actor_tree, null, 2));
	*/

	var info = './basic_info.js';
	var names = './name_list.js';
	var actor_names = './actor_names.js';
	var rename_tree = './rename_actor_tree.js';
	codeToFile(info, JSON.stringify(environments.basic_info, null, 2));
	codeToFile(names, JSON.stringify(environments.name_list, null, 2));
	codeToFile(actor_names, JSON.stringify(environments.actor_name_list, null, 2));
	codeToFile(rename_tree, JSON.stringify(environments.rename_actor_tree, null, 2));
};

var undefined_array_size = 5;
var getData = function() {
	var P = {
		Block: function (t, env) { getData(t.statements, env); },
		ActorDeclaration: function (t, env) {  // translation start
			var name = t.name;
			var basic = { fields: {}, methods: {} };
			var names = { fields: [], methods: [] };
			var environments = {
				basic: basic,
				names: names,
				rename_tree: { actor_name: name.toUpperCase(), fields_name: [], methods: [] }
			};
			getData(t.elements, environments);
			env.basic_info[name] = basic;
			env.name_list[name] = names;
			env.actor_name_list.push(name);
			env.rename_actor_tree.push(environments.rename_tree);
		},
		VariableStatement: function (t, env) {
			var environments = { fields: [t.type_specifier, env.basic.fields, env.names.fields], rename_tree: env.rename_tree };
			getData(t.declarations, environments);
		},
		PointerDeclaration: function (t, env) {
			var name = t.name;
			env.fields[1][name] = {type: env.fields[0], is_pointer: true, is_array: false, size: 1};
			env.fields[2].push(name);
			var type = env.fields[0] == 'actor' ? 'int' : env.fields[0];
			env.rename_tree.fields_name.push(
				[type, env.rename_tree.actor_name + "_" + name.toUpperCase()]
			);
		},
		ArrayDeclaration: function (t, env) {
			var name = t.name;
			var size = t.array_size-0;
			env.fields[1][name] = {type: env.fields[0], is_pointer: false, is_array: true, size: size};
			env.fields[2].push(name);
			var type = env.fields[0] == 'actor' ? 'int' : env.fields[0];
			var actor_name = env.rename_tree.actor_name;
			for (var i = 0; i < size; i ++) {
				env.rename_tree.fields_name.push(
					[type, actor_name + "_" + name.toUpperCase() + i]
				);
			}
		},
		VariableDeclaration: function (t, env) {
			var name = t.name;
			env.fields[1][name] = {type: env.fields[0], is_pointer: false, is_array: false, size: 1};
			env.fields[2].push(name);
			var type = env.fields[0] == 'actor' ? 'int' : env.fields[0];
			env.rename_tree.fields_name.push(
				[type, env.rename_tree.actor_name + "_" + name.toUpperCase()]
			);
		},
		MethodDeclaration: function (t, env) {
			var name = t.name;
			var method = {return_type: t.return_type, params: [], local: [], make_act: [0], make_msg: [{}]};
			var rename_method = {name: env.rename_tree.actor_name + "_" + name.toUpperCase(), arguments: []};
			var environments = {method_params: method.params, rename_method: rename_method};
			getData(t.params, environments);
			env.basic.methods[name] = method;
			env.names.methods.push(name);
			env.rename_tree.methods.push(rename_method);
		},
		PointerParameter: function (t, env) {
			var name = t.name;
			var type = t.type_specifier;
			var param = {name: name, type: type, is_pointer: true, is_array: false, size: 1};
			env.method_params.push(param);
			type = type == 'actor' ? 'int' : type;
			env.rename_method.arguments.push(
				[type, env.rename_method.name + "_" + name.toUpperCase()]
			);
		},
		ArrayParameter: function (t, env) {
			var name = t.name;
			var type = t.type_specifier;
			var size = t.array_size !== "undefined" ? t.array_size-0 : undefined_array_size;
			var param = {name: name, type: type, is_pointer: false, is_array: true, size: size};
			env.method_params.push(param);
			type = type == 'actor' ? 'int' : type;
			for (var i = 0; i < size; i ++) {
				env.rename_method.arguments.push(
					[type, env.rename_method.name + "_" + name.toUpperCase() + i]
				);
			}
		},
		VariableParameter: function (t, env) {
			var name = t.name;
			var type = t.type_specifier;
			var param = {name: name, type: type, is_pointer: false, is_array: true, size: 1};
			env.method_params.push(param);
			type = type == 'actor' ? 'int' : type;
			env.rename_method.arguments.push(
				[type, env.rename_method.name + "_" + name.toUpperCase()]
			);
		},
		DestructorDeclaration: function (t, env) {
			var name = t.name;
			var method = {return_type: "void", params: [], local: [], make_act: [0], make_msg: [{}]};
			var rename_method = {name: env.rename_tree.actor_name + "_" + name.toUpperCase(), arguments: []};
			var environments = {method_params: method.params, rename_method: rename_method};
			getData(t.params, environments);
			env.basic.methods[name] = method;
			env.names.methods.push(name);
			env.rename_tree.methods.push(rename_method);
		},
		ConstructorDeclaration: function (t, env) {
			var name = t.name;
			var method = {return_type: "void", params: [], local: [], make_act: [0], make_msg: [{}]};
			var rename_method = {name: env.rename_tree.actor_name + "_" + name.toUpperCase(), arguments: []};
			var environments = {method_params: method.params, rename_method: rename_method};
			getData(t.params, environments);
			env.basic.methods[name] = method;
			env.names.methods.push(name);
			env.rename_tree.methods.push(rename_method);
		}
	};

	var R = function (t, env) {
		if (Array.isArray(t)) t.forEach(function (t) { getData(t, env); });
		else if (typeof(t) === 'object') P[t.type](t, env);
	};

	return R;
}();


var token_maker = function(N) { 
	return '\"' + N + '\" !identifier_part { return \"' + N + '\"; }'
};

var makeActorPegjsElements = function() {
	var pegjs_code = './add1_b.pegjs';
	var actor_token = ["actor_name_token", "\n    = "];
	actor_name_list.forEach(
		function (t) {
		actor_token.push(token_maker(t)); 
		actor_token.push("\n    / ");
	});
	actor_token.pop();
	codeToFile(pegjs_code, actor_token.join(""));
};


String.prototype.replaceAll = function(org, dest) {  
	return this.split(org).join(dest);  
};
String.prototype.toCapitalHead = function() {
	return this.replace(this.charAt(0), this.charAt(0).toUpperCase());
};

var dactor_tmp = fs.readFileSync('header/dactor_tmp.cu', 'utf8');
var hactor_tmp = fs.readFileSync('header/hactor_tmp.cu', 'utf8');
var dmessage_tmp = fs.readFileSync('header/dmessage_tmp.cu', 'utf8');
var hmessage_tmp = fs.readFileSync('header/hmessage_tmp.cu', 'utf8');

var nltab0 = '\n';
var nltab1 = '\n    ';
var nltab2 = '\n        ';

var d_field_elements_set = function(arr) {
	return arr[0] + ' *' + arr[1] + ';';
};
var h_field_elements_set = function(arr) {
	return [
		arr[0] + ' *' + arr[1] + ';',
		arr[0] + ' *d' + arr[1] + ';'
	];
};
var d_constructor_elements_set = function(arr) {
	var size = 'n*sizeof(' + arr[0] + ')';
	return [
		'HANDLE_ERROR( cudaMalloc((void**) &' + arr[1] + ', ' + size + ') );',
		'HANDLE_ERROR( cudaMemcpy(' + arr[1] + ', acts.' + arr[1] + ', ' + size + ', cudaMemcpyHostToDevice) );'
	];
};
var h_constructor_elements_set = function(arr) {
	var size = 'n*sizeof(' + arr[0] + ')';
	return [
		arr[1] + ' = (' + arr[0] + '*)malloc(' + size + ');',
		'memset(' + arr[1] + ', 0, ' + size + ');',
		'd' + arr[1] + '= (' + arr[0] + '*)malloc(' + size + ');'
	];
};
var d_free_elements_set = function(arr) {
	return 'cudaFree(' + arr[1] + ');';
};
var h_free_elements_set = function(arr) {
	return [
		'free(' + arr[1] + ');',
		'free(d' + arr[1] + ');'
	];
};
var dtoh_elements_set = function(arr) {
	var size = 'n*sizeof(' + arr[0] + ')';
	return 'HANDLE_ERROR( cudaMemcpy(d' + arr[1] + ', acts.' + arr[1] + ', ' + size + ', cudaMemcpyDeviceToHost) );';
};
var htod_elements_set = function(arr) {
	var size = 'n*sizeof(' + arr[0] + ')';
	return 'HANDLE_ERROR( cudaMemcpy(acts.' + arr[1] + ', ' + arr[1] + ', ' + size + ', cudaMemcpyHostToDevice) );';
};

var setEnv = function(prname) {
	var d_field_elements, h_field_elements,d_constructor_elements, h_constructor_elements, d_free_elements, h_free_elements, dtoh_elements, htod_elements;
	var new_dir;

	var header_name, d_tmp, h_tmp, tmp_arr;
	var aorm_name, d_name, h_name;
	rename_actor_tree.forEach( function(t0) {
		aorm_name = t0.actor_name.toLowerCase().toCapitalHead();

		d_name = 'D' + aorm_name;
		d_tmp = dactor_tmp.replaceAll('[ORIGINAL_NAME]', d_name);
		h_name = 'H' + aorm_name;
		h_tmp = hactor_tmp.replaceAll('[ORIGINAL_NAME]', h_name);

		d_field_elements = [];
		h_field_elements = [];
		d_constructor_elements = [];
		h_constructor_elements = [];
		d_free_elements = [];
		h_free_elements = [];
		dtoh_elements = [];
		htod_elements = [];

		t0.fields_name.forEach( function (t1) {
			tmp_arr = [t1[0], t1[1].toLowerCase()];
			d_field_elements.push(d_field_elements_set(tmp_arr));
			h_field_elements = h_field_elements.concat(h_field_elements_set(tmp_arr));
			d_constructor_elements = d_constructor_elements.concat(d_constructor_elements_set(tmp_arr));
			h_constructor_elements = h_constructor_elements.concat(h_constructor_elements_set(tmp_arr));
			d_free_elements.push(d_free_elements_set(tmp_arr));
			h_free_elements = h_free_elements.concat(h_free_elements_set(tmp_arr));
			dtoh_elements.push(dtoh_elements_set(tmp_arr));
			htod_elements.push(htod_elements_set(tmp_arr));
		});

		d_tmp = d_tmp.replaceAll('[FIELD_ELEMENTS]', d_field_elements.join(nltab1));
		d_tmp = d_tmp.replaceAll('[CONSTRUCTOR_ELEMENTS]', d_constructor_elements.join(nltab2));
		d_tmp = d_tmp.replaceAll('[FREE_ELEMENTS]', d_free_elements.join(nltab2));
		h_tmp = h_tmp.replaceAll('[FIELD_ELEMENTS]', h_field_elements.join(nltab1));
		h_tmp = h_tmp.replaceAll('[CONSTRUCTOR_ELEMENTS]', h_constructor_elements.join(nltab2));
		h_tmp = h_tmp.replaceAll('[FREE_ELEMENTS]', h_free_elements.join(nltab2));
		h_tmp = h_tmp.replaceAll('[DTOH_ELEMENTS]', dtoh_elements.join(nltab2));
		h_tmp = h_tmp.replaceAll('[HTOD_ELEMENTS]', htod_elements.join(nltab2));

		new_dir = makeDirectory(prname, 'header/');
		header_name = d_name.toLowerCase() + '.cu';
		codeToFile(new_dir + '/' + header_name, d_tmp);
		headers.push(header_name);
		header_name = h_name.toLowerCase() + '.cu';
		codeToFile(new_dir + '/' + header_name, h_tmp);
		headers.push(header_name);

		t0.methods.forEach( function (t1) {
			aorm_name = t1.name.toLowerCase().toCapitalHead();

			d_name = 'D' + aorm_name;
			d_tmp = dmessage_tmp.replaceAll('[ORIGINAL_NAME]', d_name);
			h_name = 'H' + aorm_name;
			h_tmp = hmessage_tmp.replaceAll('[ORIGINAL_NAME]', h_name);

			d_field_elements = [];
			h_field_elements = [];
			d_constructor_elements = [];
			h_constructor_elements = [];
			d_free_elements = [];
			h_free_elements = [];
			dtoh_elements = [];
			htod_elements = [];

			t1.arguments.forEach( function (t2) {
				tmp_arr = [t2[0], t2[1].toLowerCase()];
				d_field_elements.push(d_field_elements_set(tmp_arr));
				h_field_elements = h_field_elements.concat(h_field_elements_set(tmp_arr));
				d_constructor_elements = d_constructor_elements.concat(d_constructor_elements_set(tmp_arr));
				h_constructor_elements = h_constructor_elements.concat(h_constructor_elements_set(tmp_arr));
				d_free_elements.push(d_free_elements_set(tmp_arr));
				h_free_elements = h_free_elements.concat(h_free_elements_set(tmp_arr));
				dtoh_elements.push(dtoh_elements_set(tmp_arr));
				htod_elements.push(htod_elements_set(tmp_arr));
			});

			d_tmp = d_tmp.replaceAll('[FIELD_ELEMENTS]', d_field_elements.join(nltab1));
			d_tmp = d_tmp.replaceAll('[CONSTRUCTOR_ELEMENTS]', d_constructor_elements.join(nltab2));
			d_tmp = d_tmp.replaceAll('[FREE_ELEMENTS]', d_free_elements.join(nltab2));
			h_tmp = h_tmp.replaceAll('[FIELD_ELEMENTS]', h_field_elements.join(nltab1));
			h_tmp = h_tmp.replaceAll('[CONSTRUCTOR_ELEMENTS]', h_constructor_elements.join(nltab2));
			h_tmp = h_tmp.replaceAll('[FREE_ELEMENTS]', h_free_elements.join(nltab2));
			h_tmp = h_tmp.replaceAll('[DTOH_ELEMENTS]', dtoh_elements.join(nltab2));
			h_tmp = h_tmp.replaceAll('[HTOD_ELEMENTS]', htod_elements.join(nltab2));

			new_dir = makeDirectory(prname, 'header/');
			header_name = d_name.toLowerCase() + '.cu';
			codeToFile(new_dir + '/' + header_name, d_tmp);
			headers.push(header_name);
			header_name = h_name.toLowerCase() + '.cu';
			codeToFile(new_dir + '/' + header_name, h_tmp);
			headers.push(header_name);
		});
	});
};


var argv = process.argv;
fs.readFile(argv[2], 'utf8', function (err, input) {
	var tree = parser.parse(input, 'start');
	util.print(JSON.stringify(tree, null, 2));

	setDataStructure(tree);

	makeActorPegjsElements();

	setEnv((argv[2].split('.'))[0]);
});
