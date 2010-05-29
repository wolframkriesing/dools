dojo.provide("dools.docs.docStringParser.JsDoc");

dojo.require("dools.docs.docStringParser._base");

dojo.declare(
	"dools.docs.docStringParser.JsDoc",
	dools.docs.docStringParser._base,
	{
		// summary: 
		//
		// examples:
		//		>>> var p = new dools.docs.docStringParser.JsDoc(); // The simplest case with two blocks.
		//		>>> dojo.toJson(p.parseClassDocString("@summary whatever.\n@end nooot"))
		//		"{"summary":"whatever.","end":"nooot"}"
		//
		//		>>> var p = new dools.docs.docStringParser.JsDoc(); // Multiple line blocks.
		//		>>> dojo.toJson(p.parseClassDocString("@summary whatever.\n line2"))
		//		"{"summary":"whatever.\nline2"}"
		//
		//		>>> var p = new dools.docs.docStringParser.JsDoc(); // Same block multiple times with multiple lines.
		//		>>> dojo.toJson(p.parseClassDocString("@summary whatever.\n @summary line2 \n line3"))
		//		"{"summary":["whatever.","line2\nline3"]}"
		//
		//		>>> var p = new dools.docs.docStringParser.JsDoc(); // Same block multiple times with multiple lines.
		//		>>> dojo.toJson(p.parseClassDocString("@summary whatever.\n @end nix\n @summary line2 \n line3\n@end foo"))
		//		"{"summary":["whatever.","line2\nline3"],"end":["nix","foo"]}"
		//
		//		>>> var p = new dools.docs.docStringParser.JsDoc(); // Test the defaultBlockKey.
		//		>>> dojo.toJson(p.parseClassDocString("whatever.\n whatever.\n @end nix\n @param line2 \n line3\n@param foo").summary)
		//		""whatever.\nwhatever.""
		
		blockParserConfig:{
			searchKeyRegExp:/^\s*@([a-zA-Z]+)\s/,
			replaceKeyRegExp:"\\s*@{key}\\s",
			defaultBlockKey: "summary"
		},

		constructor:function(){
		},
		
		_parseDocBlock:function(/*String*/docString){
			// summary: Let the base class do the basic parsing, we only convert some jsdoc specific stuff.
			var parsed = this.inherited(arguments),
				ret = dojo.clone(parsed);
			// If ûret.paramû is set we have parameters (@param) parse and move them into ûret.parametersû.
			if (typeof ret.param != "undefined"){
				ret.parameters = this._parseParameters(ret.param);
				delete ret.param;
			}
			return ret;
		},
		
		_parseParameters:function(parsedParams){
			// summary: Parse the "params" directive and stuff the results in an object.
			// examples:
			// 		>>> p = new dools.docs.docStringParser.JsDoc() // Check the most common "param" block.
			// 		>>> dojo.toJson(p.parseMethodDocString("@param {Function} foo description bar"))
			//		"{"parameters":[{"name":"foo","summary":"","datatype":"Function","description":"description bar"}]}"
			//		
			// Parse out the type and the name.
			var paramRegExp = /^\s*\{(\w+)\}\s*(\w+)/;
			var ret = [];
			var params = dojo.isArray(parsedParams) ? parsedParams : [parsedParams];
			for (var j=0, l=params.length, p; j<l; j++){
				p = params[j];
				var res = p.match(paramRegExp);
				var param = {name:"", summary:"", datatype:undefined};
				if (res==null){
					dojo.mixin(param, {description:p});
				} else {
					dojo.mixin(param, {
						name:res[2],
						description:p.replace(paramRegExp, "").replace(/^\s/, ""), // Replace the space before the description too, its the separator.
						datatype:res[1]
					});
				}
				ret.push(param);
			}
			return ret;
		}
	}
);
