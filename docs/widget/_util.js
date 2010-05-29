// maybe this file should be more global? seems not only useful for docs
dojo.provide("dools.docs.widget._util");

dojo.require("dools.markup.Parser");
dojo.require("dools.markup.language.Markdown");

dojo.provide("dools.docs.dtl.filter");
dojo.mixin(dools.docs.dtl.filter, {
	json: function(value, arg){
		try {
			return dojox.dtl.mark_safe(dojo.toJson(value, true));
		}
		catch(ex) {
			// sometimes we get a domnode, we can't serialize
			return value;
		}
	},
	
	markdown: function(value, arg){
		var parser = new dools.markup.Parser(new dools.markup.language.Markdown);
		return dojox.dtl.mark_safe(parser.parse(value));
	}
});
dojox.dtl.register.filters("dools.docs.dtl", {
	"filter": ["json", "markdown"]
});

