dojo.provide("dools.docs.summary.dojo");

dojo.require("dools.docs.summary._base");
dojo.require("dools.docs.docStringParser.Dojo");

dools.docs.summary.dojo = new (dojo.declare(
	dools.docs.summary._base,
	{
		docSyntax:"dojo",
		
		_getMethodData:function(methodName, reflectOutput, fpOutput, dpOutput){
			// summary:
			// 		Map the parameters' description properly.
			// description:
			// 		The dojo way stores the parameter's description directly in
			// 		a tag in the docstring where the key is the parameter's name
			// 		itself, that is not OpenAJAX compatible and has to be mapped
			// 		here.
			//
			// examples:
			//		>>> // Verify some parameter properties.
			//		>>> p = dools.docs.summary.dojo.getMethod("dools.docs.summary._base", "_getMethodData").parameters[1]
			//		>>> dojo.toJson([p.name, p.type, p.description])
			//		["reflectOutput","Object","All the data returned by the reflection for this one method, see «dools.docs.Reflection.getMethod()«."]
			//		
			var ret = this.inherited(arguments);
			
			// Map the method's parameters to a OpenAJAX compatible structure.
			var params = fpOutput.parameters || [];
			// Add the description, which we get from the DocStringParser.
			for (var i=0, l = params.length, name; i<l; i++){
				// Properly check if the property exists, used to be dpOutput[x] || "" which fails
				// when "x" is "constructor". Fixed by using hasOwnProperty.
// TODO write test case for the case documented above
				paramDoc = (dpOutput.hasOwnProperty(params[i].name) ? dpOutput[params[i].name] : "").split("\n");
				params[i].datatype = paramDoc[0];
				params[i].description = paramDoc.slice(1).join("\n");
			}
			ret.parameters = params;
			return ret;
		}
	}
))();
