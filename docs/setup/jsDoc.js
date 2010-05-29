dojo.provide("dools.docs.setup.jsDoc");

dojo.require("dools.docs.setup._base");
dojo.require("dools.docs.objectInfo.JsDoc"); // We always need that.

(function(){
	dojo.declare(
		"dools.docs.setup.JsDoc",
		dools.docs.setup._base,
		{
			docSyntax:"jsDoc"
		}
	);
	
	dools.docs.setup.jsDoc = new dools.docs.setup.JsDoc();
})();
