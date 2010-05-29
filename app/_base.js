dojo.provide("dools.app._base");

dojo.declare(
	"dools.app",
	null,
	{
		// summary:
		// 		The base class for all apps, defining global helpers needed by most apps.
		
		constructor:function(){
			dojo.addOnLoad(dojo.hitch(this, "onPageLoaded"));
		},
		
		onPageLoaded:function(){
			// summary: Extend this method to do something after the page was loaded.
		}
	}
);
