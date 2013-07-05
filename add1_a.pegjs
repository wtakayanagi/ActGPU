// codes under this line are actor1.pegjs elements

source_element
	= method_definition
	/ unsupported


// add_Lexical
this_token
	= "this" !identifier_part {return "this";}
new_token
	= "new" !identifier_part {return "new";}
delete_token
	= "delete" !identifier_part {return "delete";}


// add_Expressions
expression
	= head:assignment_expression tail:(__ "," __ assignment_expression)* {
		var result = [head];
		for (var i = 0, l = tail.length; i < l; i ++) {
			result.push(tail[i][3]);
		}
		return result;
	}

assignment_expression
	= left:unary_expression __ operator:assignment_operator __ right:assignment_expression {
		return {
			type: "AssignmentExpression",
			operator: operator,
			left: left,
			right: right
		};
	}
	/ binary_expression

assignment_operator
	= "="
	/ "+="
	/ "-="
	/ "*="
	/ "\/="
	/ "%="
	/ "<<="
	/ ">>="
	/ "&="
	/ "^="
	/ "|="

binary_expression
	= condition_expression

condition_expression
	= condition:logicalor_expression __
	"?" __ true_expression:assignment_expression __
	":" __ false_expression:assignment_expression {
		return {
			type: "ConditionExpression",
			condition: condition,
			true_expression: true_expression,
			false_expression: false_expression
		};
	}
	/ logicalor_expression

logicalor_expression
	= head:logicaland_expression tail:(__ logicalor_operator __ logicaland_expression)* {
        var result = head;
        for (var i = 0; i < tail.length; ++i) {
            result = {
                type: "BinaryExpression",
                operator: tail[i][1],
                left: result,
                right: tail[i][3]
            };
        }
        return result;
    }

logicalor_operator
	= "||" !"=" { return "||"; }

logicaland_expression
	= head:bitwiseor_expression tail:(__ logicaland_operator __ bitwiseor_expression)* {
        var result = head;
        for (var i = 0; i < tail.length; ++i) {
            result = {
                type: "BinaryExpression",
                operator: tail[i][1],
                left: result,
                right: tail[i][3]
            };
        }
        return result;
    }

logicaland_operator
	= "&&" !"=" { return "&&"; }

bitwiseor_expression
	= head:bitwisexor_expression tail:(__ bitwiseor_operator __ bitwisexor_expression)* {
        var result = head;
        for (var i = 0; i < tail.length; ++i) {
            result = {
                type: "BinaryExpression",
                operator: tail[i][1],
                left: result,
                right: tail[i][3]
            };
        }
        return result;
    }

bitwiseor_operator
	= "|" !("|" / "=") { return "|"; }

bitwisexor_expression
	= head:bitwiseand_expression tail:(__ bitwisexor_operator __ bitwiseand_expression)* {
        var result = head;
        for (var i = 0; i < tail.length; ++i) {
            result = {
                type: "BinaryExpression",
                operator: tail[i][1],
                left: result,
                right: tail[i][3]
            };
        }
        return result;
    }

bitwisexor_operator
	= "^" !("^" / "=") { return "^"; }

bitwiseand_expression
	= head:equality_expression tail:(__ bitwiseand_operator __ equality_expression)* {
        var result = head;
        for (var i = 0; i < tail.length; ++i) {
            result = {
                type: "BinaryExpression",
                operator: tail[i][1],
                left: result,
                right: tail[i][3]
            };
        }
        return result;
    }

bitwiseand_operator
	= "&" !("&" / "=") { return "&"; }

equality_expression
	= head:relational_expression tail:(__ equality_operator __ relational_expression)* {
        var result = head;
        for (var i = 0; i < tail.length; ++i) {
            result = {
                type: "BinaryExpression",
                operator: tail[i][1],
                left: result,
                right: tail[i][3]
            };
        }
        return result;
    }

equality_operator
	= "=="
	/ "!="

relational_expression
	= head:shift_expression tail:(__ relational_operator __ shift_expression)* {
        var result = head;
        for (var i = 0; i < tail.length; ++i) {
            result = {
                type: "BinaryExpression",
                operator: tail[i][1],
                left: result,
                right: tail[i][3]
            };
        }
        return result;
    }

relational_operator
	= "<="
	/ ">="
	/ "<"
	/ ">"

shift_expression
	= head:additive_expression tail:(__ shift_operator __ additive_expression)* {
        var result = head;
        for (var i = 0; i < tail.length; ++i) {
            result = {
                type: "BinaryExpression",
                operator: tail[i][1],
                left: result,
                right: tail[i][3]
            };
        }
        return result;
    }

shift_operator
	= "<<"
	/ ">>"

additive_expression
    = head:multiplicative_expression tail:(__ additive_operator __ multiplicative_expression)* {
        var result = head;
        for (var i = 0; i < tail.length; ++i) {
            result = {
                type: "BinaryExpression",
                operator: tail[i][1],
                left: result,
                right: tail[i][3]
            };
        }
        return result;
    }

additive_operator
	= "+" !("+" / "=") { return "+"; }
	/ "-" !("-" / "=") { return "-"; }

multiplicative_expression
    = head:unary_expression tail:(__ multiplicative_operator __ unary_expression)* {
        var result = head;
        for (var i = 0; i < tail.length; ++i) {
            result = {
                type: "BinaryExpression",
                operator: tail[i][1],
                left: result,
                right: tail[i][3]
            };
        }
        return result;
    }

multiplicative_operator
	= operator:("*" / "/" / "%") !"=" { return operator; }

unary_expression
	= postfix_expression
	/ prefix_expression

postfix_expression
	= expression:lefthandside_expression __ operator:postfix_operator {
		var result = expression;
		for (var i = 0; i < operation.length; ++i) {
            result = {
                type: "PostfixExpression",
				operator: operator,
                expression: expression
            };
        }
        return result;
    }
	/ lefthandside_expression

lefthandside_expression
	= new_expression
	/ delete_expression
	/ call_expression
	/ member_expression

new_expression
	= new_token __ constructor:actor_declaration {
		return {
			type: "NewExpression",
			constructor: constructor
		};
	}

delete_expression
	= delete_token __ expression:member_expression {
		return {
			type: "DeleteExpression",
			expression: expression
		};
	}

call_expression
	= name:member_expression "(" __ arguments: argument_expression_list? __ ")" {
		return {
			type: "FunctionCall",
			name: name,
			arguments: arguments !== "" ? arguments : []
		};
	}

argument_expression_list
    = head:assignment_expression tail:(__ "," __ assignment_expression)* {
		var result = [head];
		for (var i = 0, l = tail.length; i < l; i ++) {
			result.push(tail[i][3]);
		}
		return result;
	}

member_expression
	= base:primary_expression
	accessors:(
		__ "[" __ name:expression __ "]" { return { type: "ArrayAccess", name: name }; }
	  / __ "." __ name:identifier_name { return { type: "PropertyAccess", name: name }; }
	  / __ "->" __ name:identifier_name { return { type: "PropertyAccess", name: name }; }
	)* {
		var result = base;
		for (var i = 0, l = accessors.length; i < l; i ++) {
			result = {
				type: accessors[i].type,
				base: result,
				name: accessors[i].name
			};
		}
		return result;
	}

primary_expression
	= this_token
	/ name:identifier_name { return { type: "Variable", name: name }; }
	/ constant
	/ "(" __ expression:expression __ ")" { return expression; }

constant
	= value:decimal_literal {
		return {
			type: "NumericLiteral",
			value: value
		};
	}

postfix_operator
	= "++"
	/ "--"

prefix_expression
	= operator:prefix_operator expression: postfix_expression {
		return {
			type: "PrefixExpression",
			operator: operator,
			expression: expression
		};
	}

prefix_operator
	= "++"
	/ "--"
	/ "+"
	/ "-"
	/ "!"
	/ "&"
	/ "*"


// add_Statements
statement
	= block
	/ variable_statement
	/ empty_statement
	/ expression_statement
	/ if_statement
	/ iteration_statement
	/ continue_statement
	/ break_statement
	/ switch_statement
	/ actor_statement

initializer
	= "=" (!"=") __ expression:assignment_expression { return expression; }

empty_statement
	= ";" { return { type: "EmptyStatement" }; }

expression_statement
	= !"{" expression:expression EOS { return expression; }

if_statement
	= if_token __ "(" __ condition:expression __ ")" __ 
	if_statement:statement
	else_statement:(__ else_token __ statement)? {
		return {
			type: "IfStatement",
			condition: condition,
			if_statement: if_statement,
			else_statement: else_statement !== "" ? else_statement[3] : null
		};
	}

iteration_statement
	= while_statement
	/ dowhile_statement
	/ for_statement

while_statement
	= while_token __ "(" __ condition:expression? __ ")" __ statement:statement {
		return {
			type: "WhileStatement",
			condition: condition !== "" ? condition : null,
			statement: statement
		};
	}

dowhile_statement
	= do_token __ statement:statement __ while_token __ "(" __ condition:expression? __ ")" __ EOS {
		return {
			type:  "DoWhileStatement",
			condition: condition !== "" ? condition : null,
			statement: statement
		};
	}

for_statement
	= for_token __ "(" __ 
	initializer:(variable_statement / expression)? __ ";" __ 
	test:expression? __ ";" __ 
	counter:expression? __ ")" __ 
	statement:statement {
		return {
			type: "ForStatement",
			initializer: initializer !== "" ? initializer : null,
			test: test !== "" ? test : null,
			counter: counter !== "" ? counter : null,
			statement: statement
		};
	}

continue_statement
	= continue_token EOS { return { type: "ContinueStatement" }; }

break_statement
	= break_token EOS { return { type: "BreakStatement" }; }

switch_statement
	= switch_token __ "(" __ expression:expression __ ")" __ clauses:case_block {
		return {
			type: "SwitchStatement",
			expression: expression,
			clauses: clauses
		};
	}

case_block
	= "{" __ 
	before_clauses:case_clauses? __ 
	default_clause:default_clause? __ 
	after_clauses:case_clauses? __ 
	"}" {
		var before_cs = before_clauses !== "" ? before_clauses : [];
		var default_c = default_clause !== "" ? [default_clause] : [];
		var after_cs = after_clauses !== "" ? after_clauses : [];
		return before_cs.concat(default_c).concat(after_cs);
	}

case_clauses
	= head:case_clause tail:(__ case_clause)* {
		var result = [head];
		for (var i = 0, l = tail.length; i < l; i ++) {
			result.push(tail[i][1]);
		}
	}

case_clause
	= case_token __ selector:expression __ ":" statements:(__ statement_list)? {
		return {
			type: "CaseClause",
			selector: selector,
			statements: statements !== "" ? statements[1] : []
		};
	}

default_clause
	= default_token __ ":" statements:(__ statement_list)? {
		return {
			type: "DefaultClause",
			statements: statements !== "" ? statements[1] : []
		};
	}


// add_Actor
method_definition
	= destructor_definition
	/ constructor_definition
	/ return_type:void_token __ actor_name:actor_name_token "::" method_name:identifier_name __
	"(" __ params:method_parameter_list? __ ")" __
	"{" __ elements:method_elements __ "}" __ {
		return {
			type: "MethodDefinition",
			return_type: return_type,
			actor_name: actor_name,
			method_name: method_name,
			params: params !== "" ? params : [],
			elements: elements
		};
	}

destructor_definition
	= actor_name:actor_name_token "::~" actor_name_token __
	"(" __ params:method_parameter_list? __ ")" __
	"{" __ elements:method_elements? __ "}" __ {
		return {
			type: "DestructorDefinition",
			actor_name: actor_name,
			params: params !== "" ? params : [],
			elements: elements !== "" ? elements : []
		};
	}

constructor_definition
	= actor_name:actor_name_token "::" actor_name_token __
	"(" __ params:method_parameter_list? __ ")" __
	"{" __ elements:method_elements? __ "}" __ {
		return {
			type: "ConstructorDefinition",
			actor_name: actor_name,
			params: params !== "" ? params : [],
			elements: elements !== "" ? elements : []
		};
	}

method_elements
	= head:method_element tail:(__ method_element)* {
		var result = [head];
		for (var i = 0, l = tail.length; i < l; i ++) {
			result.push(tail[i][1]);
		}
		return result;
	}

method_element
	= statement

actor_statement
	= actor_type:actor_token __ declarations:actor_declaration_list EOS {
		return {
			type: "ActorStatement",
			actor_type: actor_type,
			declarations: declarations
		};
	}

actor_declaration_list
	= head:actor_declaration tail:(__ "," __ actor_declaration)* {
		var result = [head];
		for (var i = 0, l = tail.length; i < l; i ++) {
			result.push(tail[i][3]);
		}
		return result;
	}

actor_declaration
	= name:(actor_token / identifier) __ "(" __ arguments:argument_expression_list? __ ")" {
		return {
			type: "ActorDeclaration",
			name: name,
			arguments: arguments !== "" ? arguments : []
		};
	}

