dojo.provide("dools.docs.fileParser.Dojo");

dojo.require("dools.docs.fileParser._base");

dojo.declare(
	"dools.docs.fileParser.Dojo",
	dools.docs.fileParser._base,
	{
		// summary:
		// 		The adaption for all dojo specific file parsing.
		
		//
		// getMethodData() - tests (since the parent method is used but the result is specific to this file's implementation we have the tests here)
		//
		// example:
		// 		>>> // Return an array from this method, if class was instanciated without a method name.
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.Dojo");
		// 		>>> fp.load()
		// 		>>> typeof fp.getMethodData(["getClassDocString"]).getClassDocString
		// 		"object"
		// 		>>> // Check that 'docString' starts with expected string.
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.Dojo", "getClassDocString");
		// 		>>> fp.load()
		// 		>>> !!fp.getMethodData().docString.match(/\s*summary:\s*Extract.the.docstring.for.the.class/)
		// 		true
		// 		>>> // Check that 'fileName' ends on "fileParser/Dojo.js".
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.Dojo", "getClassDocString");
		// 		>>> fp.load()
		// 		>>> !!fp.getMethodData().fileName.match(/fileParser\/Dojo\.js$/)
		// 		true
		// 		>>> // Check that 'numLines' > 0 for "getClassDocString".
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.Dojo", "getClassDocString");
		// 		>>> fp.load()
		// 		>>> fp.getMethodData().numLines > 0
		// 		true
		// 		>>> // Check that 'numLines' > 0 for "_setObjectInfo".
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.Dojo", "_setObjectInfo");
		// 		>>> fp.load()
		// 		>>> fp.getMethodData().numLines > 0
		// 		true
		// 		>>> // Check that the 'sourceCode' property is not empty, getClassDocString() is a tricky one, since it contains regexps with { and } in them and as long we dont use a tokenizer this will fail here.
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.Dojo", "getClassDocString");
		// 		>>> fp.load()
		// 		>>> !!fp.getMethodData.sourceCode
		// 		true
		// 		>>> // Check that 'sourceCode' contains as much lines as 'numLines' does and > 0, for "getClassDocString".
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.Dojo", "getClassDocString");
		// 		>>> fp.load()
		// 		>>> var methodData = fp.getMethodData();
		// 		>>> methodData.sourceCode.split("\n").length == methodData.numLines && methodData.numLines > 0
		// 		true
		// 		>>> // Check that 'sourceCode' contains as much lines as 'numLines' does and > 0, for "_setObjectInfo".
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.Dojo", "_setObjectInfo");
		// 		>>> fp.load()
		// 		>>> var methodData = fp.getMethodData();
		// 		>>> methodData.sourceCode.split("\n").length == methodData.numLines && methodData.numLines > 0
		// 		true
		// 		>>> // Check that the 'parameters' property is properly read.
		// 		>>> var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.Dojo", "_setObjectInfo");
		// 		>>> fp.load()
		// 		>>> var params = fp.getMethodData().parameters;
		// 		>>> params[0].name+", "+params[1].name
		// 		"objInfo, methodName"
		
		
		_setObjectInfo:function(/*dools.docs.objectInfo.Dojo|String*/objInfo, /*String?*/methodName){
			// If the objectInfo is only a string make sure it becomes and instance
			if (!!methodName){
				this.objectInfo = new dools.docs.objectInfo.Dojo({objectName:objInfo, methodName:methodName});
			} else if (dojo.isString(objInfo)){
				this.objectInfo = new dools.docs.objectInfo.Dojo(objInfo);
			} else {
				this.objectInfo = objInfo;
			}
		},
		
		getClassDocString:function(){
			// summary:
			// 		Extract the docstring for the class.
			// examples:
			// 		>>> fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.Dojo"); // getClassDocString()
			// 		>>> fp.load()
			// 		>>> fp.getClassDocString().substr(0,10);
			// 		"summary"
			
			var src = this.sourceCode;
			var moduleNameEscaped = (this.objectInfo.objectName.replace(/\./g, "\\."));
			var regexps = [
				// Case 1, the standard dojo case, which is a class defined by dojo.declare.
				// e.g.: dojo.declare("dojox.form.Rating",
				new RegExp("dojo\\.declare\\s*\\(\\s*['\"]\\s*" + moduleNameEscaped + "['\"][^{]*{"),
				// Case 2, The simplest object definition.
				// e.g.: dojo.number = {
				new RegExp(moduleNameEscaped + "\\s*=\\s*\\{"),
				// Case 3, "new function(){}" and "function(){}"
				// e.g.: dojo.parser = new function(){
				// e.g.: dojo.cookie = function(/*String*/name, /*String?*/value, /*dojo.__cookieProps?*/props){
				new RegExp(moduleNameEscaped + "\\s*=\\s*(new\\s*)?function\\([^)]*\\)\\s*\\{"),
			];
			// We are executing the regexps after one another, in the hope they
			// are faster, since they fail sooner and the regexp is less complex.
			// Maybe worth profiling.
			for (var i=0, l=regexps.length; i<l; i++){
				var matchResult = src.match(regexps[i]);
				if (matchResult!=null){
					// The docstring starts after the matchResult start (.index) and the matched string
					// itself, matchResult[0].length.
					return this._extractDocString(matchResult.index + matchResult[0].length);
				}
			}
// TODO put the cases 2 and 3 into one regex ... maybe
			return "";
		},
		
		_extractDocString:function(/*int*/startPosition){
			// summary:
			// 		Extract the docstring only. Which means all lines after the "function(){" that start with double slashes.
			
			// Go through the lines, until the "){" was found, which marks the end of the parameters and the
			// start of the function body, where the docstring should be the first thing in.
			var lines = this.sourceCode.substr(startPosition).split("\n");
			var endOfParameterLine = 0;
			//if (startAtLine==undefined){
				dojo.some(lines, function(item, index){ // dojo.some stops when return is true, which is "){" was found, and the index is the line we need. Good stuff :-)
					endOfParameterLine = index;
					return item.match(/\)\s*\{/)!=null;
				});
			//}
			var docString = [];
			for (var i=endOfParameterLine+1, l=lines.length; i<l && lines[i].match(/\s*\/\//)!=null; i++){
				docString.push(lines[i].replace(/\s*\/\//, ""));
			}
			return docString.join("\n");
		},
		
		_extractPropertyData:function(/*String*/name){
			// summary:
			// 		Extract the properties data.
			// description:
			// 		We know that the docs preceeds the property declaration
			// 		so we assume this here and extract all the preceeding lines
			// 		that start with a "//".
			
			// Case 1, the simple dojo default case: "property:..."
			var regex = new RegExp("\\n\\s*" + name + "\\s*:[\\s\\S]+");
			var lines = this.sourceCode.replace(regex, "").split("\n").slice(1).reverse();
			var docString = [];
			for (var i=0, l=lines.length; i<l && lines[i].match(/\s*\/\//)!=null; i++){
				docString.push(lines[i].replace(/\s*\/\//, ""));
			}
			// "lines.length" is the line number inside this.sourceCode.
			return this._preparePropertyReturnData(lines.length, docString.reverse().join("\n"));
		},
		
		_extractMethodParameters:function(name){
			// summary:
			// 		Extract the function parameters.
			
			// Find the end of the method parameters, some like to spread them over multiple lines.
			// E.g. dojo.data.api.Read.getValue()
			var paramsRegex = new RegExp(name + "\\s*[:=]\\s*function\\s*\\(([^)]*)\\)\\s*\\{"),
				ret = [],
				src = this.sourceCode,
				search = src.match(paramsRegex);
			if (search!=null){
				var paramsLine = search[1];
				// Instanciate a "new Function()" using the params we had found and parse the
				// toString() result of it, which has any kind of comments removed :-).
				// Split the result and return it as the param names ... elegant imho, but
				// I hope that some day there is an easier more obvious way :-).
				var paramNames = new Function("anonymous", "var ret = (arguments.callee.toString().match(/function anonymous\\((.*)\\)/)[1]); return ret ? ret.split(',') : [];")();
				//var paramNames = function(paramsLine){}
				if (paramNames.length>0){
					// Parse a parameter string properly, split up the parameter names and the comments, which contain the
					// type information. Parse strings like this: "/*evt, value*/name,id,/*mucho|straing|nada[]? , bla*/ varname ,letzter".
					// (?:...) - this first part finds the optional comment leading a variable name, it must not contain * and / ... which is actually wrong - improve!
					// \w... - is the parameter name itself, which may start with [a-z_] but may continue with numbers in the name too, so \w is not sufficient
					// (?:,|$) - each parameter may end with a comma or is the end of the string itself (here we are actually ignoring that the /**/ kinda comment could also be here).
					var regex = /(?:\/\*([^\*\/]*)\*\/)?\s*(\w[0-9a-zA-Z_]*)\s*(?:,|$)/g;
					dojox.string.tokenize(paramsLine, regex, function(comment, variableName){
						ret.push({name:variableName, datatype:dojo.string.trim(comment || "")});
					});
				}
			}
			return ret;
		}
		
	}
);