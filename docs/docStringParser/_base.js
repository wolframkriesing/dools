dojo.provide("dools.docs.docStringParser._base");

dojo.declare(
	"dools.docs.docStringParser._base",
	null,
	{
		// summary: 
		//
		
		blockParserConfig:{
			// Fill in the following to match a certain syntax. See docStringParser.Dojo for an example.
			searchKeyRegExp:null,
			replaceKeyRegExp:null,
			// If the docblock starts without a key use this one instead.
			// This is e.g. the case in the JsDoc syntax.
			defaultBlockKey:null
		},
		
		constructor:function(){
		},
		
		parseClassDocString:function(/*String*/docString){
			// summary: Parse a docstring of a class, return the content as an object.
			// >>> var p = new dools.docs.docStringParser._base(); // Do nothing test.
			// >>> p.blockParserConfig.defaultBlockKey = "summary";
			// >>> dojo.toJson(p.parseClassDocString("// summary: whatever.\n// end"))
			// "{"summary":"// summary: whatever.\n// end"}"
			return this._parseDocBlock(docString);
		},
		
		parsePropertyDocString:function(/*String*/docString, /*String*/propertyName){
			// summary: Parse a docstring of a method, return the content as an object.
			// propertyName: The name of the property so it can be explicitly searched
			// 		for in the docstring, since there are mostyl notations like
			// 		"propertyName:<type>" in the docstring this is pretty useful.
			return this._parseDocBlock(docString);
		},
		
		parseMethodDocString:function(/*String*/docString){
			// summary: Parse a docstring of a method, return the content as an object.
			return this._parseDocBlock(docString);
		},
		
		_parseDocBlock:function(/*String*/docString){
			// summary: The actual parsing of the docString.
			//		We return the plain doc string,
			//		this function can be overridden to parse the docstring.
			// summary: Parse an arbitrary
			var search,
				blocks = [],
				lines = docString.split("\n"),
				key = this.blockParserConfig.defaultBlockKey || null, 
				blockLines = [];
			for (var i=0, l=lines.length, line; i<l; i++){
				line = lines[i];
				search = line.match(this.blockParserConfig.searchKeyRegExp);
				if (search!==null){
					if (blockLines.length){
						blocks.push({key:key, content:blockLines.join("\n")});
						blockLines = [];
					}
					key = search[1];
					line = line.replace(new RegExp(dojo.replace(this.blockParserConfig.replaceKeyRegExp, {key:key})), "");
				}
				line = dojo.trim(line); // Remove tabs and stuff that are just indentions from the docs block.
				blockLines.push(line);
			}
			blocks.push({key:key, content:blockLines.join("\n")});
			var ret = {};
			for (var i=0, l=blocks.length, key, value; i<l; i++){
				key = blocks[i].key,
				value = blocks[i].content;
				if (typeof ret[key]=="undefined"){ // Set value as a string on the obj prop.
					ret[key] = value;
				} else if (dojo.isArray(ret[key])){ // Add to the array.
					ret[key].push(value);
				} else { // Create an array and add new value.
					ret[key] = [ret[key], value];
				}
			}
			return ret;
		}
	}
);
