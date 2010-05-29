dojo.provide("dools.docs.setup._base");

dojo.declare(
	"dools.docs.setup._base",
	null,
	{
		// summary:
		// 		This class provides all the setup details for the docs package.
		// 		Extend it's methods to customize behavior, which in most cases will
		// 		be required.
		// description:
		// 		If you e.g. want to override the mapping of moduleNames to file names,
		// 		then you should start here.
		//
		// todo: Figure out how to load the files from the browser cache!!! that would be cool :-)
		
		// module2FilesMap: Object
		module2FilesMap:null,
		
		docSyntax:"",
		
		createObjectInfo:function(params){
			var className = this.docSyntax.substring(0,1).toUpperCase() + this.docSyntax.substring(1);
			return new dools.docs.objectInfo[className](params);
		},
		
		getSourceFiles:function(/*dools.docs.objectInfo._base*/objInfo){
			// summary:
			// 		Get an array of all the source file names that are needed for moduleName.
			
			// Do some intelligence to see how we can load moduleName.
			// Is it a file that we can require, means is it smthg like "dojo.string" which maps to "dojo/string.js"?
			// Or is it a method maybe, like "dojo.string.trim" which would also map to "dojo/string.js"?
			// The last case could be covered by listing "dojo.string.trim" in the module2FilesMap list above,
			// but that would make the list really long and we would need to list every new method+property there :-(.
			// So we try to be a bit smart about it here :-).
			var moduleName = objInfo.objectName;
			var methodName = objInfo.methodName;
			var loadableModuleName = this._getLoadableModuleName(moduleName, methodName);
			if (this.module2FilesMap==null || typeof this.module2FilesMap[loadableModuleName]=="undefined"){
				var parts = loadableModuleName.split("."),
					url = dojo.moduleUrl(parts.slice(0, -1).join("/"), parts[parts.length-1]+".js").toString();
				return [url];
			} else {
				this.require(moduleName, methodName);
				return dojo.map(this.module2FilesMap[loadableModuleName].files, 'return ""+item'); // Return strings, since dojo.moduleUrl() returns an object.
			}
		},
		
		getSourceCode:function(/*dools.docs.objectInfo._base*/objInfo){
			// summary:
			// 		Return the source code of all the source files configured for moduleName.
			var files = this.getSourceFiles(objInfo);
			var ret = {};
			for (var i=0, l=files.length; i<l; i++){
				ret[files[i]] = this._loadSourceCode(files[i]);
			}
			return ret;
		},
		
		require:function(/*String*/moduleName, /*String?*/methodName){
			// summary:
			// 		Implement here how to load a module, e.g. dojo.require().
			// description:
			// 		In the dojo case the library brings a loader out of the box,
			// 		it's mostly just dojo.require(moduleName). Other libraries
			// 		might bring their own loader or you just need to load
			// 		the files via AJAX and add them to the current environment.
			throw "Method '" + this.declaredClass + ".require()' not implemented, please do so!";
		},
		
		_loadableModuleNamesCache:{},
		_getLoadableModuleName:function(/*String*/moduleName, /*String*/methodName, /*Bool?*/preventCache){
			// summary:
			// 		Get all the module names that can be used in dojo.require() to load moduleName.
			// description:
			// 		E.g. a moduleName like "dojo.string.trim" we can not dojo.require
			// 		directly. Let's find out what is the require that works for it.
			// 		In this case "dojo.string". So we return ["dojo.string"].
			// 		Sometimes the methodName is passed separatly into here, but we
			// 		can not be sure, so we concat the methodName first and process as described above.
			// returns:
			// 		An array of module names that can be required. An array because
			// 		sometimes multiple modules have to be loaded, see "dojo.cldr" in the module2FilesMap.
			// examples:
			// 		>>> dools.docs.setup._getLoadableModuleName("dojo.string.trim") == "dojo.string"
			// 		true
			// 		>>> dools.docs.setup._getLoadableModuleName("dojo.string", "trim") == "dojo.string"
			// 		true
			// 		>>> dools.docs.setup._getLoadableModuleName("dojo.query") == "dojo.query"
			// 		true
			var m = methodName ? moduleName + "." + methodName : moduleName;
			var ret;
			if (!preventCache && typeof this._loadableModuleNamesCache[m]!="undefined"){
				return this._loadableModuleNamesCache[m];
			}
			
			if (this.module2FilesMap && typeof this.module2FilesMap[m]!="undefined"){
				ret = m;
			} else {
				var parts = m.split(".");
				var url, src;
				var ret = m;
				// Do this:
				// 1) Try to load the source file by mapping "dojo.string.trim" to "dojo/string/trim.js".
				// 2) Try to strip down the name and see if it is listed in the module2FilesMap
				// if not remove the last part ("trim" here) and do 1) with "dojo.string".
				while(parts.length>1){
					url = dojo.moduleUrl(parts.slice(0, -1).join("/"), parts[parts.length-1]+".js").toString();
					src = this._loadSourceCode(url);
					if (src == null){
						var possibleModuleName = parts.slice(0, -1).join(".");
						if (this.module2FilesMap && typeof this.module2FilesMap[possibleModuleName] == "undefined"){
							url = dojo.moduleUrl(parts.slice(0, -2).join("/"), parts[parts.length-2]+".js").toString();
						} else {
							// Now we have obviously found the matching source file, so let's assume it's this
							// and return the according values.
							ret = possibleModuleName;
							break;
						}
					} else {
						// We have found the source file, so return the URL.
						ret = parts.join(".");
						break;
					}
					parts = parts.slice(0, -1);
				}
			}
			this._loadableModuleNamesCache[m] = ret;
			return ret;
		},
		
		// Cache the loaded source codes in here. Also stores the negativ results.
		// If e.g. for "dojo/xhr.js" no source file was found it's stored in here
		// as {"dojo/xhr.js":null}, so we don't have to try again.
		_sourceCodeCache:{},
		_loadSourceCode:function(url, preventCache){
			// summary:
			// 		Load the source file synchronously.
			if (!preventCache && typeof this._sourceCodeCache[url]!="undefined"){
				return this._sourceCodeCache[url];
			}
			var ret = null;
			dojo.xhrGet({
				url:url,
				sync:true,
				handleAs:"text",
				load:function(data){
					ret = data
				},
				error:function(){
					// Actually nothing to do here :-)
				}
			});
			this._sourceCodeCache[url] = ret;
			return ret;
		}
	}
);
