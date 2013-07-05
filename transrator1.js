#!/usr/local/bin/node

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var util = require('util');
var parser = require('./actor1');


var basic_info = JSON.parse(fs.readFileSync('./basic_info.js'));
var name_list = JSON.parse(fs.readFileSync('./name_list.js'));
var actor_names = JSON.parse(fs.readFileSync('./actor_names.js'));
var rename_actor_tree = JSON.parse(fs.readFileSync('./rename_actor_tree.js'));

var updateDataStructure = function(tree) {
	var var_list = {};
	var local = {};
	var make_act = {};
	var make_msg = {};
	actor_names.forEach( function (t0) {
		var fields = name_list[t0].fields;
		var this_list = {};
		fields.forEach( function (t1) {
			this_list[t1] = basic_info[t0].fields[t1].type;
		});
		var actor_var_list = var_list[t0] = {};

		var methods = name_list[t0].methods;
		var m_local = local[t0] = {};
		var m_act = make_act[t0] = {};
		var m_msg = make_msg[t0] = {};
		methods.forEach(function (t1) {
			var actor_method_var_list = actor_var_list[t1] =
				{this: this_list, params: {}, local: {}};

			var method = basic_info[t0].methods[t1];
			m_local[t1] = method.local;
			m_act[t1] = method.make_act;
			m_msg[t1] = method.make_msg;
			method.params.forEach( function (t2) {
				actor_method_var_list.params[t2.name] = t2.type;
			});
		});
	});
	//util.print(JSON.stringify(var_list, null, 2));

	var environments0 = {
		var_list: var_list,
		local: local,
		make_act: make_act,
		make_msg: make_msg
	};
	getData(tree, environments0);
	//util.print(JSON.stringify(rename_actor_tree, null, 2));
};

var getData = function() {
	var P = {
		Block: function (t, env) { getData(t.statements, env); },
		VariableStatement: function (t, env) { getData(t.declarations, env); },
		VariableDeclaration: function (t, env) { env.local.push(t.name); },
		PointerDeclaration: function (t, env) { 
			env.local.push(t.name);
			if (t.value) getData(t.value, env);
		},
		ArrayDeclaration: function (t, env) { env.local.push(t.name); },
		PointerParameter: function (t, env) {},
		ArrayParameter: function (t, env) {},
		VariableParameter: function (t, env) {},
		AssignmentExpression: function (t, env) {},
		ConditionExpression: function (t, env) {},
		BinaryExpression: function (t, env) {},
		PostfixExpression: function (t, env) {},
		NewExpression: function (t, env) {
			var tail_point = env.make_act.length - 1;
			env.make_act[tail_point]++;
		},
		DeleteExpression: function (t, env) {},
		FunctionCall: function (t, env) {
			if (t.name.base) {
				if (Array.isArray(t.name.base)) {
					var atail_point = env.make_act.length - 1;
					env.make_act[atail_point]++;
					var func_name = t.name.name;
					var act_name = null;
					var actor_type = t.name.base[0].constructor.name;
					var mtail_point = env.make_msg.length - 1;
					env.make_msg[mtail_point][actor_type] = 
						env.make_msg[mtail_point][actor_type] !== undefined 
					? env.make_msg[mtail_point][actor_type] + 1 
					: 1;
				}
				else if (typeof(t.name.base) === 'object') {
					var func_name = t.name.name;
					var act_name = t.name.base.name;
					var actor_type = "";
					actor_type = t.name.base.base === "this" ? env.var_list.this[act_name]
					: env.var_list.params[act_name] ? env.var_list.params[act_name]
					: env.var_list.local[act_name];
					var tail_point = env.make_msg.length - 1;
					env.make_msg[tail_point][actor_type] = 
						env.make_msg[tail_point][actor_type] !== undefined 
					? env.make_msg[tail_point][actor_type] + 1 
					: 1;
				}
			}
		},
		ArrayAccess: function (t, env) {},
		PropertyAccess: function (t, env) {},
		Variable: function (t, env) {},
		NumericLiteral: function (t, env) {},
		PrefixExpression: function (t, env) {},
		EmptyStatement: function (t, env) {},
		IfStatement: function (t, env) {
			var tmp_local = {}, tmp_act = {}, tmp_msg = {};
			var environments = {};
			environments = { var_list: env.var_list, local: [], make_act: [0], make_msg: [{}] };
			getData(t.if_statement, environments);
			tmp_local["if"] = environments.local;
			tmp_act["if"] = environments.make_act;
			tmp_msg["if"] = environments.make_msg;
			if (t.else_statement) {
				environments = { var_list: env.var_list, local: [], make_act: [0], make_msg: [{}] };
				getData(t.else_statement, environments);
				tmp_local["else"] = environments.local;
				tmp_act["else"] = environments.make_act;
				tmp_msg["else"] = environments.make_msg;
			}
			env.local.push(tmp_local);
			env.make_act.push(tmp_act, 0);
			env.make_msg.push(tmp_msg, {});
		},
		WhileStatement: function (t, env) {
			var tmp_local = {}, tmp_act = {}, tmp_msg = {};
			var environments = {};
			environments = { var_list: env.var_list, local: [], make_act: [0], make_msg: [{}] };
			getData(t.statement, environments);
			tmp_local["while"] = environments.local;
			tmp_act["while"] = environments.make_act;
			tmp_msg["while"] = environments.make_msg;
			env.local.push(tmp_local);
			env.make_act.push(tmp_act, 0);
			env.make_msg.push(tmp_msg, {});
		},
		DoWhileStatement: function (t, env) {
			var tmp_local = {}, tmp_act = {}, tmp_msg = {};
			var environments = {};
			environments = { var_list: env.var_list, local: [], make_act: [0], make_msg: [{}] };
			getData(t.statement, environments);
			tmp_local["dowhile"] = environments.local;
			tmp_act["dowhile"] = environments.make_act;
			tmp_msg["dowhile"] = environments.make_msg;
			env.local.push(tmp_local);
			env.make_act.push(tmp_act, 0);
			env.make_msg.push(tmp_msg, {});
		},
		ForStatement: function (t, env) {
			var tmp_local = {}, tmp_act = {}, tmp_msg = {};
			var environments = {};
			if (!t.initializer) {
				environments = { var_list: env.var_list, local: [], make_act: [0], make_msg: [{}] };
				getData(t.initializer, environments);
				tmp_local["initfor"] = environments.local;
			}
			environments = { var_list: env.var_list, local: [], make_act: [0], make_msg: [{}] };
			getData(t.statement, environments);
			tmp_local["for"] = environments.local;
			tmp_act["for"] = environments.make_act;
			tmp_msg["for"] = environments.make_msg;
			env.local.push(tmp_local);
			env.make_act.push(tmp_act, 0);
			env.make_msg.push(tmp_msg, {});
		},
		ContinueStatement: function (t, env) {},
		BreakStatement: function (t, env) {},
		SwitchStatement: function (t, env) {
			var tmp_local = {}, tmp_act = {}, tmp_msg = {};
			var environments = {};
			t.clauses.forEach( function (t0, i) {
				environments = { var_list: env.var_list, local: [], make_act: [0], make_msg: [{}] };
				getData(t0.statements, environments);
				tmp_local["case"+i] = environments.local;
				tmp_act["case"+i] = environments.make_act;
				tmp_msg["case"+i] = environments.make_msg;
			});
			env.local.push(tmp_local);
			env.make_act.push(tmp_act, 0);
			env.make_msg.push(tmp_msg, {});
		},
		CaseClause: function (t, env) {},
		DefaultClause: function (t, env) {},
		MethodDefinition: function (t, env) {  // translation start
			var actor_name = t.actor_name;
			var method_name = t.method_name;
			var environments = {
				var_list: env.var_list[actor_name][method_name],
				local: env.local[actor_name][method_name],
				make_act: env.make_act[actor_name][method_name],
				make_msg: env.make_msg[actor_name][method_name]
			};
			getData(t.elements, environments);
		},
		DestructorDefinition: function (t, env) {
			var actor_name = t.actor_name;
			var environments = {
				var_list: env.var_list[actor_name][actor_name],
				local: env.local[actor_name][actor_name],
				make_act: env.make_act[actor_name][actor_name],
				make_msg: env.make_msg[actor_name][actor_name]
			};
			getData(t.elements, environments);
		},
		ConstructorDefinition: function (t, env) {
			var actor_name = t.actor_name;
			var environments = {
				var_list: env.var_list[actor_name][actor_name],
				local: env.local[actor_name][actor_name],
				make_act: env.make_act[actor_name][actor_name],
				make_msg: env.make_msg[actor_name][actor_name]
			};
			getData(t.elements, environments);
		},
		ActorStatement: function (t, env) { 
			t.declarations.forEach( function (t0) {
				env.var_list.local[t0.name] = t.actor_type;
				env.local.push(t0.name);
			});
			getData(t.declarations, env); 
		},
		ActorDeclaration: function (t, env) {
			var tail_point = env.make_act.length - 1;
			env.make_act[tail_point]++;
		}
	};

	var R = function (t, env) {
		if (Array.isArray(t)) t.forEach(function (t) { getData(t, env); });
		else if (typeof(t) === 'object') P[t.type](t, env);
	};

	return R;
}();


var codeTransform = function(tree) {

};

var transform = function() {
	var P = {
		Block: function (t, env) { transform(t.statements, env); },
		VariableStatement: function (t, env) {},
		VariableDeclaration: function (t, env) {},
		PointerDeclaration: function (t, env) {},
		ArrayDeclaration: function (t, env) {},
		PointerParameter: function (t, env) {},
		ArrayParameter: function (t, env) {},
		VariableParameter: function (t, env) {},
		AssignmentExpression: function (t, env) {},
		ConditionExpression: function (t, env) {},
		BinaryExpression: function (t, env) {},
		PostfixExpression: function (t, env) {},
		NewExpression: function (t, env) {},
		DeleteExpression: function (t, env) {},
		FunctionCall: function (t, env) {},
		ArrayAccess: function (t, env) {},
		PropertyAccess: function (t, env) {},
		Variable: function (t, env) {},
		NumericLiteral: function (t, env) {},
		PrefixExpression: function (t, env) {},
		EmptyStatement: function (t, env) {},
		IfStatement: function (t, env) {},
		WhileStatement: function (t, env) {},
		DoWhileStatement: function (t, env) {},
		ForStatement: function (t, env) {},
		ContinueStatement: function (t, env) {},
		BreakStatement: function (t, env) {},
		SwitchStatement: function (t, env) {},
		CaseClause: function (t, env) {},
		DefaultClause: function (t, env) {},
		MethodDefinition: function (t, env) {},  // translation start
		DestructorDefinition: function (t, env) {},
		ConstructorDefinition: function (t, env) {},
		ActorStatement: function (t, env) {},
		ActorDeclaration: function (t, env) {}
	};

	var R = function (t, env) {
		if (Array.isArray(t)) t.forEach(function (t) { transform(t, env); });
		else if (typeof(t) === 'object') P[t.type](t, env);
	};

	return R;
}();


var argv = process.argv;
fs.readFile(argv[2], 'utf8', function (err, input) {
	var tree = parser.parse(input, 'start');
	util.print(JSON.stringify(tree, null, 2));

	updateDataStructure(tree);
});
