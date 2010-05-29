dojo.provide("dools.docs.tests.module");

try{
	dojo.require("dools.docs.setup");
	tests.registerDocTests("dools.docs.setup");
	
	dojo.require("dools.docs.widget.ClassView");
	tests.registerDocTests("dools.docs.widget.ClassView");
	
	
	//dojo.requireIf(dojo.isBrowser, "tests.back-hash");
}catch(e){
	doh.debug(e);
}
