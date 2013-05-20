start
	= __ program:program __ { return program; }

program
	= elements:source_elements {
		return elements;
	}

source_elements
	= head:source_element tail:(__ source_element)* {
		var result = head !== "" ? [head] : [];
		for (var i = 0, l = tail.length; i < l; i ++) {
			var tmp = tail[i][1];
			if (tmp !== "") result.push(tmp);
		}
		return result;
	}

source_element
	= actor_declaration
	/ unsupported

unsupported
	= (!("{" / ";") SourceCharacter)* (unsupported_part ";"? / ";") { return ""; }

unsupported_part
	= "{" (!"}" (unsupported_part / SourceCharacter))* "}"


// Lexical
SourceCharacter
	= [^\\;]
	/ "\\" .
	/ .

Whitespace "whitespace"
    = [ \t\v\f\u00a0\uFEFF]

LineTerminator
	= [\n\r\u2028\u2029]

Comment "comment"
	= MultiLineComment
	/ SingleLineComment

MultiLineComment
	= "/*" (!"*/" SourceCharacter)* "*/"

SingleLineComment
	= "//" (!LineTerminator SourceCharacter)*

EOS 
    = __ ";" __

__
	= (Whitespace / LineTerminator / Comment)*

if_token = "if" !identifier_part
else_token = "else" !identifier_part
while_token = "while" !identifier_part
do_token = "do" !identifier_part
for_token = "for" !identifier_part
continue_token = "continue" !identifier_part
break_token = "break" !identifier_part
switch_token = "switch" !identifier_part
case_token = "case" !identifier_part
default_token = "default" !identifier_part
void_token = "void" !identifier_part { return "void"; }
int_token = "int" !identifier_part { return "int"; }
float_token = "float" !identifier_part { return "float"; }
actor_token
	= "actor" !identifier_part { return "actor"; }
	/ actor_name_token
actor_name_token = "actor"

identifier
    = !keyword name:identifier_name { return name; }

identifier_name
    = start:identifier_start parts:(identifier_part)* {
        return start + parts.join("");
    }

identifier_start
    = "_"
    / unicode_letter

identifier_part
    = identifier_start
    / unicode_digit

unicode_upper
	= [A-Z]

unicode_lower
	= [a-z]

unicode_letter
    = [A-Za-z]

unicode_digit
    = [0-9]

keyword
	= condition_reserved_word
	/ type_specifier

condition_reserved_word
	= if_token
	/ else_token
	/ while_token
	/ do_token
	/ for_token
	/ continue_token
	/ break_token
	/ switch_token
	/ case_token
	/ default_token


// Expressions
decimal_literal
    = "0" / digit:nonzero_digit digits:decimal_digits? { return digit + digits; }
    
decimal_digits
    = digits:decimal_digit+ { return digits.join(""); }

decimal_digit
    = [0-9]

nonzero_digit
    = [1-9]


// Statements
statement_list
	= head:statement tail:(__ statement)* {
		var result = [head];
		for (var i = 0, l = tail.length; i < l; i ++) {
			result.push(tail[i][1]);
		}
		return result;
	}

statement
	= block
	/ variable_statement
	/ method_declaration

block
    = "{" __ statements:statement_list? __ "}" {
        return {
            type: "Block",
            statements: statements !== "" ? statements : []
        }
    }

type_specifier
	= void_token
	/ int_token
	/ float_token
	/ actor_token

variable_statement
    = type_specifier:type_specifier __ declarations:variable_declaration_list EOS {
        return {
            type: "VariableStatement",
            type_specifier: type_specifier,
            declarations: declarations
        };
    }

variable_declaration_list
    = head:variable_declaration tail:(__ "," __ variable_declaration)* {
        var result = [head];
        for (var i = 0, l = tail.length; i < l; i ++) {
            result.push(tail[i][3]);
        }
        return result;
    }

variable_declaration
    = pointer_declaration
	/ array_declaration
	/ name:identifier __ value:initializer? {
        return {
            type: "VariableDeclaration",
            name: name,
			value: value !== "" ? value : null
        };
    }

initializer
	= "="

pointer_declaration
	= "*" __ name:identifier __ value:initializer? {
		return {
			type: "PointerDeclaration",
			name: name,
			value: value !== "" ? value : null
		};
	}

array_declaration
	= name:identifier __
	"[" __ array_size:decimal_literal __ "]" __ value:initializer? {
		return {
			type: "ArrayDeclaration",
			name: name,
			array_size: array_size,
			value: value !== "" ? value : null
		};
	}

method_declaration
	= return_type:void_token __ name:identifier __
	"(" __ params:method_parameter_list? __ ")" EOS {
		return {
			type: "MethodDeclaration",
			return_type: return_type,
			name: name,
			params: params !== "" ? params : []
		};
	}
	/ destructor_declaration
	/ constructor_declaration

method_parameter_list
	= head:method_parameter tail:(__ "," __ method_parameter)* {
		var result = [head];
		for (var i = 0, l = tail.length; i < l; i ++) {
			result.push(tail[i][3]);
		}
		return result;
	}

method_parameter
	= method_pointer_parameter
	/ method_array_parameter
	/ method_variable_parameter

method_pointer_parameter
	= type_specifier:type_specifier __ "*" __ name:identifier {
		return {
			type: "PointerParameter",
			type_specifier: type_specifier,
			name: name
		};
	}

method_array_parameter
	= type_specifier:type_specifier __ name:identifier __
	"[" __ array_size:decimal_literal? __ "]" {
		return {
			type: "ArrayParameter",
			type_specifier: type_specifier,
			name: name,
			array_size: array_size !== "" ? array_size : "undefined"
		};
	}

method_variable_parameter
	= type_specifier:type_specifier __ name:identifier {
		return {
			type: "VariableParameter",
			type_specifier: type_specifier,
			name: name
		};
	}

destructor_declaration
	= "~" name:identifier __ "(" __ params:method_parameter_list? __ ")" EOS {
		return {
			type: "DestructorDeclaration",
			name: name,
			params: params !== "" ? params : []
		};
	}

constructor_declaration
	= name:identifier __ "(" __ params:method_parameter_list? __ ")" EOS {
		return {
			type: "ConstructorDeclaration",
			name: name,
			params: params !== "" ? params : []
		};
	}


// Actor
actor_declaration
	= actor_token __ name:identifier __ "{" __ elements:actor_elements? __ "}" EOS {
		return {
			type: "ActorDeclaration",
			name: name,
			elements: elements !== "" ? elements: []
		};
	}

actor_elements
	= head:actor_element tail:(__ actor_element)* {
		var result = [head];
		for (var i = 0, l = tail.length; i < l; i ++) {
			result.push(tail[i][1]);
		}
		return result;
	}

actor_element
	= statement


