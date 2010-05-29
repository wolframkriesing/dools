dojo.provide("dools.docs.docStringParser.tests.module");

try{
	dojo.require("dools.docs.docStringParser._base");
	tests.registerDocTests("dools.docs.docStringParser._base");
	
	dojo.require("dools.docs.docStringParser.Dojo");
	tests.registerDocTests("dools.docs.docStringParser.Dojo");
	
	dojo.require("dools.docs.docStringParser.JsDoc");
	tests.registerDocTests("dools.docs.docStringParser.JsDoc");
	
	//dojo.requireIf(dojo.isBrowser, "tests.back-hash");
}catch(e){
	doh.debug(e);
}
