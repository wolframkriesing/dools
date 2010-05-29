dojo.provide("dools.docs.summary.tests.module");

try{
	dojo.require("dools.docs.summary._base");
	tests.registerDocTests("dools.docs.summary._base");
	
	dojo.require("dools.docs.summary.dojo");
	tests.registerDocTests("dools.docs.summary.dojo");
	
	dojo.require("dools.docs.summary.jsDoc");
	tests.registerDocTests("dools.docs.summary.jsDoc");
	
	//dojo.requireIf(dojo.isBrowser, "tests.back-hash");
}catch(e){
	doh.debug(e);
}
