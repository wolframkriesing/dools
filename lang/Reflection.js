dojo.provide("dools.lang.Reflection");

dojo.declare(
	"dools.lang.Reflection",
	null,
	{
		// summary: Functionality for inspecting the docs of a given module.
		
		// moduleName: String
		// 		The module name passed into this class on instanciation.
		moduleName:"",
		// methodName: String?
		// 		The method name passed into this class on instanciation.
		// 		Only required if you only want to reflect onto one method.
		// 		See also «constructor()« for more info.
		methodName:"",
		
		constructor:function(/*String*/moduleName, /*String?*/methodName, /*Object?*/scope){
			// summary:
			// 		Init the class with either a module name or a module name and a method to inspect.
			// moduleName: String
			// 		The module name, such as "dojo" or "dijit.form.ComboBox".
			// 		If it is not a string it's used as the module itself.
			// methodName: String?
			// 		Optionally a method name can be given, if you want to reduce the
			// 		load on this class. E.g. something like this would make a lot of sense.
			// 			var r = new dools.lang.Reflection("dojo", "query");
			// 			var data = r.getMethod();
			// 		This means you only want to inspect the method dojo.query, not
			// 		the entire dojo namespace, which makes the reflection much faster.
			// scope: Object
			// 		If not given "dojo.global" is used. This is useful if you have to inspect
			// 		an object which is not in the current scope. E.g. when the docviewer
			// 		application is built and distributed under the namespace "apidocs.*"
			// 		then you need to tell the reflection explicitly where to find the moduleName.
			// examples:
			// 		>>> // Test getMethod() when passed a methodName to the constructor.
			// 		>>> typeof new dools.lang.Reflection("dools.lang.Reflection", "getType").getMethod()
			// 		"object"
			// 		>>> typeof new dools.lang.Reflection(dools.lang.Reflection, "getType").getMethod() // Accept also the object if given explicitly.
			// 		"object"
			this.methodName = methodName;
			this.scope = scope || dojo.global;
			if (dojo.isString(moduleName)){
				this.moduleName = moduleName;
				var module = this._getObject();
			} else {
				this.moduleName = "__unknown__";
				var module = moduleName;
			}
			if (typeof module=="undefined"){
				throw Error("Module '"+moduleName+"' not loaded, make sure you load it before starting the '" + this.declaredClass + "' on it!");
			}
			this.module = module;
		},
		
		_getObject:function(){
			// summary: Copy+pasted dojo.getObject method here, but ignore the scopeMap.
			// description:
			//		Normally getObject would access the scoped dojo version, but we need the globally defined one.
			//		This is needed especially in the built version, since it could
			//		be "thrown" on any website with an already existing "dojo".
			// returns: mixed
			// 		The object ready to use.
			// examples:
			// 		>>> // Test _getObject() with simple "dojo".
			// 		>>> new dools.lang.Reflection("dojo")._getObject() == dojo
			//		true
			// 		>>> // Test _getObject() with "dools.lang.Reflection".
			// 		>>> new dools.lang.Reflection("dools.lang.Reflection")._getObject() == dools.lang.Reflection
			//		true
			var parts = this.moduleName.split("."),
				obj = this.scope;
			for(var i=0, p; obj && (p=parts[i]); i++){
				obj = obj[p];
			}
			return obj; // mixed
		},
		
		getType:function(){ // Is getType a good name???? not better getKind()
			// >>> new dools.lang.Reflection("dools.lang.Reflection").getType() // getType class
			// "class"
			// >>> new dools.lang.Reflection("dojo.query").getType() // getType function
			// "function"
			// >>> dojo.require("dojo.cookie"); // getType function for dojo.cookie
			// >>> new dools.lang.Reflection("dojo.cookie").getType()
			// "function"
			// >>> new dools.lang.Reflection("dojo.string").getType() // getType module
			// "module"
			// >>> new dools.lang.Reflection("dojox").getType() // getType module for dojox
			// "module"
			// >>> new dools.lang.Reflection("dojo").getType() // getType module for dojo
			// "module"
			// >>> dojo.require("dojo.parser"); // getType module for dojo.parser
			// >>> new dools.lang.Reflection("dojo.parser").getType()
			// "module"
			var ret = typeof this.module == "undefined" ? null
					: (!!(this.module.prototype && !!this.module.prototype.declaredClass)) ? "class" // May be this could become dojo.isClass()?
					: dojo.isFunction(this.module) ? "function"
					: this._isModule() ? "module"
					: "property";
			return ret;
		},
		
		_isModule:function(module){
			// summary: Check if the given parameter is a module, like dojo, dojo.lang, dijit, etc.
			// description:
			// 		Other type checks should have been done before calling this method
			//		so don't expose this result without additional checks!
			//		E.g. if 'module' is a class, it would return true too!
			var m = module || this.module;
			var objs = [];
			for (var i in m){
				if (i=="toString"){ // toString() can be implemented to return a nice string representation, but that doesnt mean its a module, see dojo.version!
					continue;
				}
				switch (typeof m[i]){
					case "function":
						return true;
					case "object":
						objs.push(m[i]);
						break;
				}
			}
			if (objs.length){
				for (var i=0, l=objs.length; i<l; i++){
					if (this._isModule(objs[i])){
						return true;
					}
				}
			}
			return false;
		},
		
		getApi:function( /* bool */ includeInherited){
			// summary:
			// 		Get the entire API of the module, all methods, properties, etc.
			//
			// >>> var api = new dools.lang.Reflection("dools.lang.Reflection").getApi() // getApi()
			// >>> api.methods.getApi && typeof api.methods["getMethods"]!="undefined"
			// true
			var ret = {
				methods:this.getMethods(includeInherited),
				properties:this.getProperties(includeInherited)
			};
			return ret;
		},
		
		getMethod:function( /* bool */ includeInherited){
			// summary: If the methodName was passed to the constructor return exactly this method only.
			// todo: This is pretty inefficient, since it still calls getMethods() which loops over all methods,
			// 		but calling getMethod() everytime inside the for-loop doesnt seem to impressive either,
			// 		better solutions please come forward.
			if (this.methodName){
				return this.getMethods(includeInherited)[this.methodName];
			}
			return null;
		},
		
		getMethods:function( /* bool */ includeInherited){
			// summary: Get all methods of the given module, if includeInherited=true also the one of the parent class(es).
			// returns: Returns an object of all the methods of this class, the name is the index and the value
			// 		is an object with various property information of the method, such as isInherited, isOverriden, scope, etc.
			// 		By returning an object as the value we can add any kind of information for a method,
			// 		looks pretty future safe I would say.
			// description:
			// 
			// includeInherited:
			//		Include the parent methods?
			//		defaultValue:false
			var all = includeInherited==true;
			var ret = {};
			var m = this.module, p = m.prototype, s = m.superclass;
			// Get all methods defined in the prototoype.
			for (var i in p){
				var isInherited = !!(s && s[i] && s[i].toString() == p[i].toString());
				var isOverridden = !!(s && s[i] && s[i].toString() != p[i].toString());
				var returnInherited = (all || !isInherited);
				if (typeof p[i]=="function" && returnInherited){
					ret[i] = {
						// OpenAJAX defined properties.
						scope:"instance",
						visibility:i.charAt(0)=="_" ? (i.charAt(1)=="_" ? "protected" : "private") : "public",
						// Additional properties (not defined in OpenAJAX).
						definedInPrototype:true,
						isInherited:isInherited,
						isOverridden:isOverridden,
						implementedIn:[]
					};
				}
			}
			// Get all "static" methods, which are defined right on the object, not in the prototype.
			for (var i in m){
				var isInherited = !!(s && s[i] && s[i].toString() == m[i].toString());
				var isOverridden = !!(isInherited && s && s[i] && s[i].toString() != m[i].toString());
				var returnInherited = (all || !isInherited);
				if (typeof m[i]=="function" && returnInherited){
					ret[i] = {
						// OpenAJAX defined properties.
						scope:"static",
						visibility:i.charAt(0)=="_" ? (i.charAt(1)=="_" ? "protected" : "private") : "public",
						// Additional properties (not defined in OpenAJAX).
						definedInPrototype:false,
						isInherited:isInherited,
						isOverridden:isOverridden,
						implementedIn:[]
					};
				}
			}
			// The "_constructor" is actually "constructor", it gets renamed in dojo.declare.
			if (typeof ret["_constructor"]!="undefined"){
				ret.constructor = ret._constructor;
				ret.constructor.visibility = "public";
				delete ret._constructor;
			}
			
			if (includeInherited){
				var parents = this.getParents();
				if (parents){
					var parentReflection, methods, m, parentName;
					for (var i=0, l=parents.length; i<l; i++){
						parentName = parents[i];
						parentReflection = new dools.lang.Reflection(parentName);
						methods = parentReflection.getMethods(true);
						for (var i in methods){
							m = methods[i];
							if (ret[i] && (m.isOverridden || !m.isInherited)){
								ret[i].implementedIn.push(parentName);
							}
							if (m.implementedIn.length){
								ret[i].implementedIn = ret[i].implementedIn.concat(m.implementedIn);
							}
						}
					}
				}
			}
			
			return ret;
		},
		
		getProperties:function( /* bool */ includeInherited){
			// >>> // Verify that the properties returned are an array and have at least moduleName and methodName in it.
			// >>> var p = new dools.lang.Reflection("dools.lang.Reflection").getProperties()
			// >>> typeof p.moduleName!="undefined" && typeof p.methodName!="undefined"
			// true
			var all = includeInherited==true;
			var ret = {};
			var m = this.module, p = m.prototype, s = m.superclass;
			for (var i in p){
				var isInherited = !!(s && s[i] && s[i].toString() == p[i].toString()),
					isOverridden = !!(s && s[i] && s[i].toString() != p[i].toString());
				if (typeof p[i]!="function" && (all || (!s || ""+s[i] != ""+p[i]))){
					ret[i] = {
						// OpenAJAX compatible attributes.
						name:i,
						scope:"instance",
						"default":p[i],
						readonly:i.charAt(0)!="_",
						// Additional to OpenAJAX.
						definedInPrototype:true,
						isInherited:isInherited,
						isOverridden:isOverridden,
						visibility:i.charAt(0)=="_" ? (i.charAt(1)=="_" ? "protected" : "private") : "public"
					};
				}
			}
			for (var i in m){
				var isInherited = !!(s && s[i] && s[i].toString() == m[i].toString()),
					isOverridden = !!(isInherited && s && s[i] && s[i].toString() != m[i].toString());
				if (typeof m[i]!="function" && (all || (!s || ""+s[i] != ""+p[i]))){
					ret[i] = {
						// OpenAJAX compatible attributes.
						name:i,
						scope:"static",
						"default":m[i],
						readonly:i.charAt(0)!="_",
						// Additional to OpenAJAX.
						definedInPrototype:false,
						isInherited:isInherited,
						isOverridden:isOverridden,
						visibility:i.charAt(0)=="_" ? (i.charAt(1)=="_" ? "protected" : "private") : "public"
					};
				}
			}
			return ret;
		},
		
		getParents:function(){
			// summary: Return the parent class(es).
			// description: Dojo allows multiple inheritance, so multiple classes
			// 		may be the parent class(es).
			
			// If a class inherits from multiple classes the superclass.declaredClass may
			// look like this: "dijit.form.Button_dojox.form._BusyButtonMixin"
			// We have to split it at the "_" but watch out for the "_BusyButtonMixin".
			// So we split a little smarter and handle that.
			var ret = [];
			if (dojo.version.revision < 20500){ // TODO here we actually need to check the revision of the dojo that we are inspecting, not this one we are using here to generate the docs.
				if (this.module.superclass && this.module.superclass.declaredClass){
					ret = this.module.superclass.declaredClass.replace(/\._/g, "|").split("_");
					ret = dojo.map(ret, 'return item.replace(/\\|/, "._")');
				}
			} else {
				if (this.module._meta){
					ret = dojo.map(this.module._meta.bases.slice(1), "return item.prototype.declaredClass"); // Ignore the first one, its the class itself.
				}
			}
			return ret;
		},
		
		getAncestors:function(){
			// summary: Get the entire inheritance chain.
			// returns: An array which could look like this:
			// 		[ ????? todo
			// 			"base1": [
			// 			"base1_1",
			// 			"base1_2":["base1_2_1", "base1_2_2"]
			// 		],
			// 			"base1_1",
			// 			"base1_2":["base1_2_1", "base1_2_2"]
			// 		]
			// >>> // Return all the ancestors, recursively ...
			// false
return this.getParents(); // TODO remove and do right
		},
		
		isInherited:function(name){
			
		}
	}
);
