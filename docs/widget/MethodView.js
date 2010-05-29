dojo.provide("dools.docs.widget.MethodView");

dojo.require("dijit._Widget");
dojo.require("dojox.dtl._DomTemplated");
dojo.require("dools.docs.widget._util");

dojo.declare(
	"dools.docs.widget.MethodView",
	[dijit._Widget, dojox.dtl._DomTemplated],
	{
		// summary: Renders the API doc view for a method.


		// summary: The DTL template for the list, so simple that an extra file seems unnecessary overhead.
		templatePath:dojo.moduleUrl("dools.docs.widget.templates", "MethodView.html"),

		objectName:"",
		methodName:"",
		docSyntax:"",
		tplData:null,

		postMixInProperties:function(){
			// summary:
			var objInfo = dools.docs.setup[this.docSyntax].createObjectInfo({objectName:this.objectName, methodName:this.methodName, id:this.objectInfoId});
			dojo.require("dools.docs.summary." + objInfo.docSyntax);
			this.tplData = dools.docs.summary[this.docSyntax].getMethod(objInfo);
			this.inherited(arguments);
		}
	}
);

