dojo.provide("dools.docs.fileParser.JsDoc");

dojo.require("dools.docs.fileParser._base");

dojo.declare(
	"dools.docs.fileParser.JsDoc",
	dools.docs.fileParser._base,
	{
		_setObjectInfo:function(objInfo, methodName){
			// If the objectInfo is only a string make sure it becomes and instance
			if (!!methodName){
				this.objectInfo = new dools.docs.objectInfo.JsDoc({objectName:objInfo, methodName:methodName});
			} else if (dojo.isString(objInfo)){
				this.objectInfo = new dools.docs.objectInfo.JsDoc(objInfo);
			} else {
				this.objectInfo = objInfo;
			}
		},
		
		getClassDocString:function(){
			var src = this.sourceCode,
				moduleNameEscaped = (this.objectInfo.objectName.replace(/\./g, "\\.")),
				regexps = [
					// Case 1, the standard, e.g. PhoneGap does that.
					// e.g.: function ModuleName(){}
					new RegExp("function\\s+" + moduleNameEscaped + "\\s*\\("),
					// Case 2, defining a variable as the class.
					// e.g.: ModuleName = function(){}
					new RegExp(moduleNameEscaped + "\\s*=\\s*function\\s*\\("),
				];
			// We are executing the regexps one after another, in the hope they
			// are faster, since they fail sooner and the regexp is less complex.
			// Maybe worth profiling.
			for (var i=0, l=regexps.length; i<l; i++){
				var matchResult = src.match(regexps[i]);
				if (matchResult!=null){
					var lines = src.substr(0, matchResult.index).split("\n").reverse();
					return this._getComment(lines.slice(2));
				}
			}
			return "";
		},
		
		_extractDocString:function(startPosition){
			// summary:
			// 		Extract the docstring only. Which means all lines before
			// 		the line "startPosition" that are inside /** and */.
			
			// Lets trim the sourcecode so we remove empty lines, and the
			// last line should be the end of our docString comment.
			var lines = dojo.trim(this.sourceCode.substr(0, startPosition)).split("\n");
			lines.reverse();
			if (dojo.trim(lines[0])!="*/"){
				return "";
			}
			return this._getComment(lines);
		},
		
		_extractPropertyData:function(/*String*/name){
			// summary:
			// 		Extract the properties data.
			// description:
			// 		We know that the docs preceeds the property declaration
			// 		so we assume this here and extract all the preceeding lines
			// 		that start with a "//".
			
			// Case 1, the simple default case: "this.property = ..."
// TODO optimize this, remove the match for: [\\s\\S]+  I think this is really slow.
			var regex = new RegExp("\\*\\/\\n\\s*this\\." + name + "\\s*=[\\s\\S]+");
			var lines = this.sourceCode.replace(regex, "").split("\n").reverse();
			var docString = this._getComment(lines.slice(1));
			// "lines.length" is the line number inside this.sourceCode.
			return this._preparePropertyReturnData(lines.length+1, docString);
		},
		
		_getComment:function(lines){
			// summary:
			//		Find the beginning of the comment and return the pure comment string.
			// lines: Array
			// 		The lines in reverse order where we will extract the comment
			// 		from.
			
			var commentStart = 0;
			var endFound = dojo.some(lines, function(line, index){
				commentStart = index;
				return dojo.trim(line)=="/**";
			});
			if (!endFound){
				return "";
			}
			var commentsOnly = dojo.map(lines.slice(0, commentStart).reverse(), 'return item.replace(/\\s*\\*\\s*/, "")');
			return commentsOnly.join("\n")
		}
	}
);