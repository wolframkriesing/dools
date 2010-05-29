dojo.provide("dools.docs.widget.ApiList");

dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dijit._Widget");
dojo.require("dojox.dtl._DomTemplated");
dojo.require("dools.docs.widget._apiData");

dojo.declare(
	"dools.docs.widget.ApiList",
	[dijit._Widget, dojox.dtl._DomTemplated],
	{
		// summary: A simple list of the API read from the given URLs.
		// example:
		// |<div dojoType="dools.docs.widget.ApiTree" urls="../resources/dojoApi-dools.json">
		// |	<script type="dojo/method" event="onNodeClick" args="treeNode,name,type">
		// |		dojo.byId("clicked").innerHTML = name + " (" + type + ")";
		// |	</script>
		// |</div>


		// summary: The DTL template for the list, so simple that an extra file seems unnecessary overhead.
		templateString:	'<div dojoAttachPoint="domNode" class="apiList">'
							+'{% for m in tplData.modules %}'
								+'<a href="javascript://" dojoAttachEvent="onclick:_onClick" class="_type_{{ m.type }}" '
								+'_moduleName="{{ m.moduleName }}" _id="{{ m.id }}">{{ m.moduleName }}</a>'
							+'{% endfor %}'
						+'</div>',

		// urls: Array
		// summary:
		// 		The URLs for initializing this widget.
		urls:[],
		tplData:null,
		// dataById: Object
		// 		The API data indexed by id.
		dataById:null,

		constructor:function(){
			this.urls = [];
			this.dataById = {};
		},

		postMixInProperties:function(){
			// summary:
			// 		Generate the this.tplData that will be used in the template.
			var apiData = dools.docs.widget._apiData,
				data = apiData.toStoreData(apiData.load(this.urls));
			this.tplData = {modules:[]};
			for (var i=0, l=data.length, d; i<l; i++){
				d = data[i];
				if (!d.type) continue; // All without a type are just folders, leave them out.
				this.tplData.modules.push({
					id:d.id,
					type:d.type,
					moduleName:d.moduleName
				});
				this.dataById[d.id] = d;
			}
			this.inherited(arguments);
		},

		_filterInitialized:false,
		filter:function(/*String*/s, /*String|Array*/types){
			// summary:
			// 		Filter the visible list by the given search string "s" and the type.
			// types:
			// 		Either just a string, like "object" or an array like ["class", "object"].
			// 		All the matching items will be made visible.
			if (!this._filterInitialized){ // With DTL the postCreate() can not be overridden, it throws an error every time, so we init it here, too bad.
				dojo.query("a", this.domNode).forEach("item._actualInnerHTML=item.innerHTML; item._id=dojo.attr(item, '_id')");
				this._filterInitialized = true;
			}
			// summary: Shows the matches and highlights the string search for, hides all other nodes.
			s = dojo.trim(typeof s=="undefined" ? "" : s);
			types = typeof types=="undefined" ? [] : dojo.isArray(types) ? types : [types];
			var dataById = this.dataById;
			if (s==""){
				dojo.query("a", this.domNode).forEach(function(item){
					item.innerHTML = item._actualInnerHTML;
					if (types.length==0 || dojo.indexOf(types, dataById[item._id].type)!=-1){
						dojo.style(item, {display:"block"});
					} else {
						dojo.style(item, {display:"none"});
					}
				});
			} else {
				dojo.query("a", this.domNode).forEach(function(item){
					if (types.length==0 || dojo.indexOf(types, dataById[item._id].type)!=-1){
						var sLower = s.toLowerCase(),
							content = item._actualInnerHTML,
							contentLower = content.toLowerCase(),
							idx = contentLower.indexOf(sLower);
						if (idx!=-1){
							item.innerHTML = content.substr(0,idx)
								+ '<span class="highlight">' + content.substr(idx, s.length) + '</span>'
								+ content.substr(idx+s.length);
							dojo.style(item, {display:"block"});
							return;
						}
					}
					dojo.style(item, {display:"none"});
				});
			}
		},

		onClick:function(evt, data){
			// summary:
			// 		Connect here to catch the click on any of the items.
		},

		_onClick:function(evt){
			// summary:
			// 		Just an intermediary method, which is called from the
			// 		template's attachpoint an "redirects" to «onClick«.
			var t = evt.target;
			// Loop down the DOM tree to the node that has the attribute "moduleName" in case
			// the user clicked the highlight span we created inside the link.
			while(t!=this.domNode && !dojo.attr(t, "_moduleName")){ t = t.parentNode; }
			var id = dojo.attr(t, "_id");
			if (id){
				var data = this.dataById[id];
				this.onClick(evt, data);
				dojo.stopEvent(evt);
			}
		}
	}
);

