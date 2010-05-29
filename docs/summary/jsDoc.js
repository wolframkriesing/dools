dojo.provide("dools.docs.summary.jsDoc");

dojo.require("dools.docs.summary._base");
dojo.require("dools.docs.docStringParser.JsDoc");

dools.docs.summary.jsDoc = new (dojo.declare(
	dools.docs.summary._base,
	{
		docSyntax:"jsDoc"
	}
))();