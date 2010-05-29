dojo.provide("dools.docs.widget.ClassView");

dojo.require("dijit._Widget");
dojo.require("dojox.dtl._DomTemplated");
dojo.require("dools.docs.widget._util");

dojo.declare(
	"dools.docs.widget.ClassView",
	[dijit._Widget, dojox.dtl._DomTemplated],
	{
		// summary: Renders the API doc view for a method.

		templatePath:dojo.moduleUrl("dools.docs.widget.templates", "ClassView.html"),

		className:"",
		docSyntax:"",
		objectInfoId:"",
		tplData:null,

		postMixInProperties:function(){
			// summary:
			//		Accept both for instanciating the ObjectInfo, className and the objectInfoId.
			//		The ObjectInfo will find out what to use.
			var objInfo = dools.docs.setup[this.docSyntax].createObjectInfo({objectName:this.className, id:this.objectInfoId});
			dojo.require("dools.docs.summary." + objInfo.docSyntax);
			var classData = dools.docs.summary[objInfo.docSyntax].getClass(objInfo);
			
			classData.sortedMethodList = this._sortObject(classData.methods);
			classData.sortedPropertyList = this._sortObject(classData.properties);

			this.tplData = classData;
			this.inherited(arguments);
		},

		_onClickNumFiles:function(){
			dojo.toggleClass(this.fileNamesNode, "displayNone");
		},

		_onClickMethod:function(evt){
			dojo.query(".completeInfo", evt.target.parentNode).toggleClass("displayNone");
		},

		_onClickProperty:function(evt){
			dojo.query(".completeInfo", evt.target.parentNode).toggleClass("displayNone");
		},

		_sortObject:function(object){
			// summary: Sort an object by key, put underscore prefixed items at the end and return an array.
			// example:
			// 		>>> // Sort by the given key.
			// 		>>> var o = {_z:{k:"_z"}, _a:{k:"_a"}, a:{k:"a"}, z:{k:"z"}, e:{k:"e"}}
			// 		>>> dojo.toJson(new dools.docs.widget.ClassView.prototype._sortObject(o))
			// 		"[{"k":"a"},{"k":"e"},{"k":"z"},{"k":"_a"},{"k":"_z"}]"
			// 		>>> // Make sure sorting is case-insensitive.
			// 		>>> var o = {_b:{k:"_b"}, BA:{k:"BA"}, B:{k:"B"}, a:{k:"a"}, _A:{k:"_A"}, A:{k:"A"}}
			// 		>>> dojo.toJson(new dools.docs.widget.ClassView.prototype._sortObject(o))
			// 		"[{"k":"a"},{"k":"A"},{"k":"B"},{"k":"BA"},{"k":"_A"},{"k":"_b"}]"
			var sortableNames = [], ret = [];
			// Sort methods and properties.
			for (var m in object){ sortableNames.push(m) }
			// Make sure to sort by lowercase, otherwise we get: "A", "_a", "a" :-/.
			sortableNames.sort(function(a,b){var x=(""+a).toLowerCase(), y=(""+b).toLowerCase(); return x==y ? 0 : (x<y?-1:1)});
			// Put all methods starting with an underscore at the end of methodNames.
			for (var i=0, l=sortableNames.length; i<l && sortableNames[i].charAt(0)=="_"; i++){}
			var splitOff = sortableNames.splice(0, i);
			sortableNames = sortableNames.concat(splitOff);
			for (var i=0, l=sortableNames.length; i<l; i++){
				ret.push(object[sortableNames[i]]);
			}
			return ret;
		}
	}
);
