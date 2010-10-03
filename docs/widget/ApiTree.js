dojo.provide("dools.docs.widget.ApiTree");

dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dijit.Tree");
dojo.require("dijit.tree.ForestStoreModel");
dojo.require("dools.docs.widget._apiData");

dojo.declare(
	"dools.docs.widget.ApiTree",
	dijit.Tree,
	{
		// summary: Build an API tree from the JSON files given by the parameter "urls".
		// example:
		// 	|	<div dojoType="dools.docs.widget.ApiTree" urls="../resources/dojoApi-dojo.json,../resources/dojoApi-dijit.json,../resources/dojoApi-dojox.json">
		// 	|		<script type="dojo/method" event="onNodeClick" args="treeNode,name,type">
		// 	|			dojo.byId("clicked").innerHTML = name + " (" + type + ")";
		// 	|		</script>
		// 	|	</div>

		
		// summary: 
		urls:[],
		
		// summary: We don't want no root to be shown here, the JSON files contain the entire structure.
		// 		So we don't need no virtual root node.
		showRoot:false,
		
		postCreate:function(){
			// summary: Setup the tree, read the JSON files and convert them so they are useable in the tree.
			var d = dools.docs.widget._apiData;
			this.store = new dojo.data.ItemFileReadStore({
				data:{identifier:"id", label:"label", items:d.toStoreData(d.load(this.urls))},
				onComplete:function(){}
			});
			this.model = new dijit.tree.ForestStoreModel({
				store: this.store, query: {isRoot:true}, rootId: "root", childrenAttrs: ["children"]});
			this.inherited(arguments);
			
			// Connect on a node click and pass all values that the item has.
			var valueFnc = dojo.hitch(this.store, "getValue");
			var attrsFnc = dojo.hitch(this.store, "getAttributes");
			dojo.connect(this, "onClick", dojo.hitch(this, function(_, treeNode){
				var item = treeNode.item;
				var attrs = attrsFnc(item);
				var data = {};
				for (var i=0, l=attrs.length; i<l; i++){
					data[attrs[i]] = valueFnc(item, attrs[i]);
				}
				this.onNodeClick(treeNode, data);
			}));
			
			// Add a CSS class, so we can nicer style the tree.
			dojo.addClass(this.domNode, "apiTree");
		},
		
		getIconClass: function(item, opened){
			// The following is probably quite slow, since it's executed for every item.
			var type = this.store.isItem(item) ? this.store.getValue(item, "type") : null;
			if (type){
				return "dijitLeaf _type_" + item.type; // For some reason claro theme needs the class "dijitLeaf".
			} else {
				return opened ? "dijitFolderOpened" : "dijitFolderClosed";
			}
		},
		
		onNodeClick:function(treeNode, data){
			// summary:
			// 		Connect onto this method to hook onto a node click in the tree.
			// data: Object
			// 		Contains all the key:value pairs as given for the item in
			// 		your JSON file, normally looks like this:
			// 			{moduleName:"dojo.array", name:"array", "type":"object", id:1}
			// 		The "id" is actually a random number without importance.
			// description:
			// 		E.g. dojo.connect(tree, "onNodeClick", function(node, data){...and your code here...})
		}
	}
);
