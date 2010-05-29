dojo.provide("dools.docs.setup.phoneGap"); // Just so its loadable via dojo.require()

dojo.require("dools.docs.setup._base");

(function(){
	
we still need to make it dools.docs.setup.phoneGap imho
	dojo.mixin(
		dools.docs.setup,
		{
			// summary:
			// 		PhoneGap is pretty simple structured, that's why we mostly
			//		just (re)implemented every function here and don't really use the parent class a lot, seemed
			//		much faster and more efficient.
			//
			//
			
			baseUrl: dojo.moduleUrl("dools.app.apidoc.phonegap").path,
			
			docSyntax: "jsDoc",
			
			getObjectInfo:function(params){
				// summary:
				// 		Adapt the ObjectInfo data as needed in this case here.
				if (!params.id){
					throw "Need an 'id' for creating an ObjectInfo instance.";
				}
				return new dools.docs.ObjectInfo({
					id:params.id,
					className:params.id.split(".")[1],
					docSyntax:this.docSyntax
				});
			},
			
			getSourceFiles: function(/*dools.docs.objectInfo.PhoneGap*/objectInfo){
				var parts = objectInfo.id.split("."),
					fileName = this.baseUrl +
								(this._dirMap[parts[0]] || (parts[0] + "/js/")) +
								parts[1].toLowerCase();
				return [fileName];
			},
			
			// _dirMap: Object
			// 		Map the namespace to the directory where the sources can be found.
			// 		E.g. "android" is always "android/js", this is the default,
			// 		so its not listed here. Others explicitly listed here are
			// 		different.
			_dirMap: {
				iphone:"PhoneGapLib/javascripts/core",
				"symbian.wrt":"javascripts",
				winmo:"www/js"
			},
			require:function(objectInfo){
				var files = this.getSourceFiles(objectInfo);
				for (var i=0, l=files.length; i<l; i++){
					var content = dojo._getText(files[i], true);
					try{window.eval(content);}catch(e){}
				}
			}
		}
	);
})();
