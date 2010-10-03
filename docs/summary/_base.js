dojo.provide("dools.docs.summary._base");

dojo.require("dools.docs.setup._base");
dojo.require("dools.docs.Reflection");

dojo.declare(
	"dools.docs.summary._base",
	null,
	{
		docSyntax:"dojo",
		
		getMethod:function(objectInfo){
			// summary:
			// 		Return all the data for a method.
			// description:
			// 		Don't use this method for iterating over multiple methods, use
			// 		«getClass()« for that. This method is optimized to just load
			// 		as little data as possible and not an entire class and will therefore
			// 		also be slower when used for iterating.
			var o = objectInfo.objectName;
			var m = objectInfo.methodName;
			objectInfo.setupObject.require(o, m);
			var reflect = new dools.docs.Reflection(objectInfo.getReflectableObject(), m);
			var reflectOutput = reflect.getMethod();
			// Uppercase first letter, like: "dojo" => "Dojo" and "jsDoc" => "JsDoc".
			var parserName = this.docSyntax.substr(0,1).toUpperCase() + this.docSyntax.substr(1);
			dojo.require("dools.docs.fileParser." + parserName);
			dojo.require("dools.docs.docStringParser." + parserName);
			var fp = new dools.docs.fileParser[parserName](o, m);
			fp.load();
			var fpOutput = fp.getMethodData();
			var dp = new dools.docs.docStringParser[parserName](o);
			var dpOutput = dp.parseMethodDocString(fpOutput.docString);
			return this._getMethodData(m, reflectOutput, fpOutput, dpOutput);
		},
		
		getClass:function(objectInfo){
			return this._getClassData(objectInfo);
		},
		
		_getClassData:function(objectInfo){
			// summary: Gather all the class data and return an (OpenAJAX compatible) structure.
			objectInfo.setupObject.require(objectInfo.objectName, objectInfo.methodName);
			var c = objectInfo.objectName;
			var reflect = new dools.docs.Reflection(objectInfo.getReflectableObject());
			var api = reflect.getApi(true);
			var reflectMethods = api.methods;
			var reflectProperties = api.properties;
			var methodNames = [], propertyNames = [];
			// Uppercase first letter, like: "dojo" => "Dojo" and "jsDoc" => "JsDoc".
			var parserName = this.docSyntax.substr(0,1).toUpperCase() + this.docSyntax.substr(1);
			dojo.require("dools.docs.fileParser." + parserName);
			dojo.require("dools.docs.docStringParser." + parserName);
			var fp = new dools.docs.fileParser[parserName](c);
			fp.load();
			for(var i in reflectMethods){ methodNames.push(i) }
			for(var i in reflectProperties){ propertyNames.push(i) }
			var fpMethodData = fp.getMethodData(methodNames);
			var fpPropertyData = fp.getPropertyData(propertyNames);
			var dp = new dools.docs.docStringParser[parserName](c);
			var parsedClassDocString = dp.parseClassDocString(fp.getClassDocString());
			
			// Prepare the methods' and properties data.
			var methods = {};
			for (var m in reflectMethods){
				methods[m] = this._getMethodData(m, reflectMethods[m], fpMethodData[m], dp.parseMethodDocString(fpMethodData[m].docString));
			}
			var properties = {};
			for (var p in reflectProperties){
				properties[p] = this._getPropertyData(p, reflectProperties[p], fpPropertyData[p], dp.parsePropertyDocString(fpPropertyData[p].docString, p));
			}
			var ret = {
				// OpenAJAX compatible format of the data.
				name:c,
				shortDescription:parsedClassDocString.summary || "",
				description:parsedClassDocString.description || "",
				ancestors:reflect.getParents(),//TODO get all ancestors recursively
				constructor:"",
				properties:properties,
				methods:methods,
				ancestors:reflect.getAncestors(),
				
				// Additional stuff, that is not specified in OpenAjax
				files:this._getFileInfo(objectInfo.setupObject.getSourceFiles(objectInfo)),
	// TODO actually, we should only get "examples" and not an array once and a string another time ...
				examples:typeof parsedClassDocString.example=="undefined" ? [] : (dojo.isArray(parsedClassDocString.example) ? parsedClassDocString.example : [parsedClassDocString.example]),
				stats:{
					methods:{
						numPublic:dojo.filter(methodNames, 'return item.charAt(0)!="_"').length,
						numPrivate:dojo.filter(methodNames, 'return item.charAt(0)=="_"').length
					},
					properties:{
						numPublic:dojo.filter(propertyNames, 'return item.charAt(0)!="_"').length,
						numPrivate:dojo.filter(propertyNames, 'return item.charAt(0)=="_"').length
					}
				}
			};
			return ret;
		},
		
		_getFileInfo:function(fileNames){
// TODO use a simple dojo.map for it, but write tests first :-)
			var ret = [];
			for (var i=0, l = fileNames.length, f; i<l; i++){
				f = fileNames[i];
				ret.push({
					name:f.replace(/^(\.\.\/)*/, ""),
					url:f
				});
			}
			return ret;
		},
		
		_getMethodData:function(methodName, reflectOutput, fpOutput, dpOutput){
			// summary:
			// 		Return the data for one method by combining the data of reflection, fileparser and docstringparser properly.
			// description:
			// 		The returned structure will be OpenAJAX compatible, with some
			// 		extensions, since we can deliver a lot more data.
			// methodName: String
			// 		The method name.
			// reflectOutput: Object
			// 		All the data returned by the reflection for this one method, see «dools.docs.Reflection.getMethod()«.
			// fpOutput: Object
			// 		The data from the FileParser, see «dools.docs.FileParser.getMethodData()«.
			// dpOutput: Object
			// 		Data from the DocStringParser, see «dools.docs.docStringParser._base.parseMethodDocString()«.
			//
			// examples:
			//		>>> // Verify some method properties.
			//		>>> dojo.require("dools.docs.objectInfo.Dojo");
			//		>>> m = dools.docs.summary.dojo.getMethod(new dools.docs.objectInfo.Dojo({objectName:"dojo", methodName:"query"}))
			//		>>> dojo.toJson([m.scope, m.visibility, m.isInherited, m.isOverridden])
			//		"["static","public",false,false]"
			//
			// 		>>> // Implement "usage" property.
			// 		false
			
			var ret = {
				// OpenAJAX compatible.
				name:methodName,
				scope:reflectOutput.scope,
				visibility:reflectOutput.visibility,
				usage:"TODO: required, optional, zero-or-more, one-or-more",
				shortDescription:dpOutput.summary || "",
				description:dpOutput.description || "",
				parameters:fpOutput.parameters || [],
				returnType:0,
				
				// Additional stuff, that is not specified in OpenAjax
				// For methods that are implemented in an ancestor this fpOutput.fileName is undefined.
				file:!fpOutput.fileName ? null : dojo.mixin(this._getFileInfo([fpOutput.fileName])[0], {
					lineNumber:fpOutput.lineNumber,
					numLines:fpOutput.numLines
				}),
				examples:!dpOutput.hasOwnProperty("example") ? [] : (dojo.isArray(dpOutput.example) ? dpOutput.example : [dpOutput.example]),
				implementedIn:reflectOutput.implementedIn,
				definedInPrototype:reflectOutput.definedInPrototype,
				isInherited:reflectOutput.isInherited,
				isOverridden:reflectOutput.isOverridden,
				sourceCode:fpOutput.sourceCode
			};
			// Mix the dpOutput.parameters content into ret.parameters.
			var params = dpOutput.parameters;
			if (params){
				for (var i=0, l=params.length; i<l; i++){
					if (typeof ret.parameters[i]=="undefined"){
						ret.parameters[i] = {};
					}
					dojo.mixin(ret.parameters[i], params[i]);
				}
			}
			return ret;
		},
		
		_getPropertyData:function(propertyName, reflectOutput, fpOutput, dpOutput){
			// summary:
			// 		Return the data for one property by combining the data of reflection, fileparser and docstringparser properly.
			// description:
			// 		The returned structure will be OpenAJAX compatible, with some
			// 		extensions, since we can deliver a lot more data.
			// propertyName: String
			// 		The property's name.
			// reflectOutput: Object
			// 		All the data returned by the reflection for this one property, see «dools.docs.Reflection.getProperties()«.
			// fpOutput: Object
			// 		The data from the FileParser, see «dools.docs.FileParser.getPropertyData()«.
			// dpOutput: Object
			// 		Data from the DocStringParser, see «dools.docs.docStringParser._base.parsePropertyDocString()«.
			var ret = {
				// OpenAJAX compatible.
				name:propertyName,
				readonly:reflectOutput.readonly,
				scope:reflectOutput.scope,
				visibility:reflectOutput.visibility, //???????defined in OpenAJAX?
				datatype:dpOutput.datatype,
				"default":reflectOutput["default"],
				description:dpOutput.summary || "",
				
				// Additional stuff, that is not specified in OpenAjax
				file:!fpOutput.fileName ? null : dojo.mixin(this._getFileInfo([fpOutput.fileName])[0], {
					lineNumber:fpOutput.lineNumber
				}),
				isInherited:reflectOutput.isInherited,
				isOverridden:reflectOutput.isOverridden
			};
			return ret;
		}
	}
);
