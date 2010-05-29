dojo.provide("dools.docs.setup.dojo"); // Just so its loadable via dojo.require()

dojo.require("dools.docs.setup._base");
dojo.require("dools.docs.objectInfo.Dojo"); // We always need that.

(function(){
	dojo.declare(
		"dools.docs.setup.Dojo",
		dools.docs.setup._base,
		{
			docSyntax:"dojo",
			
			require:function(/*String*/moduleName, /*String?*/methodName){
				var loadableModuleName = this._getLoadableModuleName(moduleName, methodName);
				if (typeof this.module2FilesMap[loadableModuleName]!="undefined"){
					// Require the files too. Actually this problem occured when loading dojo/colors.js
					// but to be able to inspect it correctly we also have to do dojo.require("dojo.colors")
					// otherwise dojo.Colors.named only has 16 elements, after the require
					// it has 100 some colors.
					// Also dojo.cldr can not be required, you actually need to require the
					// modules dojo.cldr.monetary and dojo.cldr.supplemental.
					// Maybe a __all__ property inside those namespaces would be a good idea.
					// Just like python does it, so you know what is there.
					var req = this.module2FilesMap[loadableModuleName].requires;
					if (req) dojo.forEach(req, "dojo.require(item)");
				} else {
					dojo.require(loadableModuleName);
				}
			},
			
			module2FilesMap:{
				"djConfig":{requires:null, files:[dojo.moduleUrl("dojo", "dojo.js")]},
				
				"dojo":{requires:null, files:[
					dojo.moduleUrl("dojo", "dojo.js"),
					dojo.moduleUrl("dojo._base", "Color.js"),
					dojo.moduleUrl("dojo._base", "Deferred.js"),
					dojo.moduleUrl("dojo._base", "array.js"),
					dojo.moduleUrl("dojo._base", "browser.js"),
					dojo.moduleUrl("dojo._base", "connect.js"),
					dojo.moduleUrl("dojo._base", "declare.js"),
					dojo.moduleUrl("dojo._base", "event.js"),
					dojo.moduleUrl("dojo._base", "fx.js"),
					dojo.moduleUrl("dojo._base", "html.js"),
					dojo.moduleUrl("dojo._base", "json.js"),
					dojo.moduleUrl("dojo._base", "lang.js"),
					dojo.moduleUrl("dojo._base", "query.js"),
					dojo.moduleUrl("dojo._base", "window.js"),
					dojo.moduleUrl("dojo._base", "xhr.js"),
					
					dojo.moduleUrl("dojo._base._loader", "bootstrap.js"),
					dojo.moduleUrl("dojo._base._loader", "hostenv_browser.js"),
					dojo.moduleUrl("dojo._base._loader", "loader.js")
				]},
				"dojo._Animation":{requires:null, files:[dojo.moduleUrl("dojo._base", "fx.js")]},
				"dojo.cldr":{requires:["dojo.cldr.monetary", "dojo.cldr.supplemental"], files:[dojo.moduleUrl("dojo.cldr", "monetary.js"), dojo.moduleUrl("dojo.cldr", "supplemental.js")]},
				"dojo.Color":{
					requires:["dojo.colors"],
					files:[
						dojo.moduleUrl("dojo", "colors.js"),
						dojo.moduleUrl("dojo._base", "Color.js")
					]
				},
				"dojo.Color.named":{requires:["dojo.colors"], files:[dojo.moduleUrl("dojo", "colors.js")]},
				"dojo.colorFromRgb":{requires:["dojo.colors"], files:[dojo.moduleUrl("dojo", "colors.js")]},
				"dojo.create":{requires:null, files:[dojo.moduleUrl("dojo._base", "html.js")]},
				"dojo.Deferred":{requires:null, files:[dojo.moduleUrl("dojo._base", "Deferred.js")]},
				"dojo.fx.Toggler":{requires:["dojo.fx"], files:[dojo.moduleUrl("dojo", "fx.js")]},
				"dojo.keys":{requires:null, files:[dojo.moduleUrl("dojo._base", "event.js")]},
				// TODO list NodeList-fx und -html separatly, but problem is described below
		// ??????mmmmmmmmhhh how can we di this? problem we can not do reflection on NodeList-fx  "dojo.NodeList-fx":{requires:["dojo.NodeList-fx"], files:[dojo.moduleUrl("dojo._base", "NodeList.js"), dojo.moduleUrl("dojo", "NodeList-fx.js")]},
				"dojo.NodeList":{
					requires:null,
					files:[
						dojo.moduleUrl("dojo._base", "NodeList.js"),
						dojo.moduleUrl("dojo", "NodeList-fx.js"),
						dojo.moduleUrl("dojo", "NodeList-html.js"),
						dojo.moduleUrl("dojo", "NodeList-manipulate.js"),
						dojo.moduleUrl("dojo", "NodeList-traverse.js")
					]
				},
				"dojo.query":{requires:null, files:[dojo.moduleUrl("dojo._base", "query.js")]},
				
				//
				// dijit
				// 
				"dijit":{requires:null, files:[dojo.moduleUrl("dijit", "dijit.js")]},
				"dijit.form.ComboButton":{requires:["dijit.form.Button"], files:[dojo.moduleUrl("dijit.form", "Button.js"), dojo.moduleUrl("dijit.form", "ComboButton.js")]},
				"dijit.form.ComboBoxMixin":{requires:["dijit.form.ComboBox"], files:[dojo.moduleUrl("dijit.form", "ComboBox.js")]},
				"dijit.form.DropDownButton":{requires:["dijit.form.Button"], files:[dojo.moduleUrl("dijit.form", "Button.js"), dojo.moduleUrl("dijit.form", "DropDownButton.js")]},
				"dijit.form.ToggleButton":{requires:["dijit.form.Button"], files:[dojo.moduleUrl("dijit.form", "Button.js"), dojo.moduleUrl("dijit.form", "ToggleButton.js")]},
				"dijit.form.MappedTextBox":{requires:["dijit.form.ValidationTextBox"], files:[dojo.moduleUrl("dijit.form", "ValidationTextBox.js"), dojo.moduleUrl("dijit.form", "RangeBoundTextBox.js")]},
				"dijit.form.NumberTextBoxMixin":{requires:["dijit.form.NumberTextBox"], files:[dojo.moduleUrl("dijit.form", "NumberTextBox.js")]},
				"dijit.form.RadioButton":{requires:["dijit.form.CheckBox"], files:[dojo.moduleUrl("dijit.form", "CheckBox.js")]},
				"dijit.form.RangeBoundTextBox":{requires:["dijit.form.RangeBoundTextBox"], files:[dojo.moduleUrl("dijit.form", "ValidationTextBox.js"), dojo.moduleUrl("dijit.form", "RangeBoundTextBox.js")]},
				"dijit.form._ComboBoxMenu":{requires:["dijit.form.ComboBox"], files:[dojo.moduleUrl("dijit.form", "ComboBox.js")]},
				"dijit.form._ComboBoxDataStore":{requires:["dijit.form.ComboBox"], files:[dojo.moduleUrl("dijit.form", "ComboBox.js")]},
				"dijit.form._FormValueWidget":{requires:["dijit.form._FormWidget"], files:[dojo.moduleUrl("dijit.form", "_FormWidget.js")]},
				"dijit.form._SliderMover":{requires:["dijit.form.HorizontalSlider"], files:[dojo.moduleUrl("dijit.form", "HorizontalSlider.js")]},
				"dijit.layout._AccordionButton":{requires:["dijit.layout.AccordionContainer"], files:[dojo.moduleUrl("dijit.layout", "AccordionContainer.js")]},
				"dijit.layout._Splitter":{requires:["dijit.layout.BorderContainer"], files:[dojo.moduleUrl("dijit.layout", "BorderContainer.js")]},
				"dijit.layout._StackButton":{requires:["dijit.layout.StackController"], files:[dojo.moduleUrl("dijit.layout", "StackController.js")]},
				"dijit.layout._TabButton":{requires:["dijit.layout.TabController"], files:[dojo.moduleUrl("dijit.layout", "TabController.js")]},
				"dijit.layout._Gutter":{requires:["dijit.layout.BorderContainer"], files:[dojo.moduleUrl("dijit.layout", "BorderContainer.js")]},
				"dijit.range":{requires:["dijit._editor.range"], files:[dojo.moduleUrl("dijit._editor", "range.js")]},
				"dijit._editor":{requires:["dijit._editor.html"], files:[dojo.moduleUrl("dijit._editor", "html.js")]},
				"dijit._InlineEditor":{requires:["dijit.InlineEditBox"], files:[dojo.moduleUrl("dijit", "InlineEditBox.js")]},
				"dijit._MasterTooltip":{requires:["dijit.Tooltip"], files:[dojo.moduleUrl("dijit", "Tooltip.js")]},
				"dijit._MenuBase":{requires:["dijit.Menu"], files:[dojo.moduleUrl("dijit", "Menu.js")]},
				"dijit._MenuBarItemMixin":{requires:["dijit.MenuBarItem"], files:[dojo.moduleUrl("dijit", "MenuBarItem.js")]},
				"dijit._TreeNode":{requires:["dijit.Tree"], files:[dojo.moduleUrl("dijit", "Tree.js")]},
				"dijit._Widget":{requires:["dijit._Widget", "dijit.layout.LayoutContainer"],
								files:[dojo.moduleUrl("dijit", "_Widget.js"), dojo.moduleUrl("dijit.layout", "LayoutContainer.js")]
				},
				
				//
				// dojox
				// 
				"dojox":{requires:null, files:[]},
				"dojox.analytics":{
					requires:["dojox.analytics"],
					files:[
						dojo.moduleUrl("dojox", "analytics.js"),
						dojo.moduleUrl("dojox.analytics", "_base.js")
					]
				},
				"dojox.lang.aspect":{
					requires:[
						"dojox.lang.aspect",
						"dojox.lang.aspect.cflow",
						"dojox.lang.aspect.counter",
						"dojox.lang.aspect.memoizer",
						"dojox.lang.aspect.memoizerGuard",
						"dojox.lang.aspect.profiler",
						"dojox.lang.aspect.timer",
						"dojox.lang.aspect.tracer"
					],
					files:[
						dojo.moduleUrl("dojox.lang", "aspect.js"),
						dojo.moduleUrl("dojox.lang.aspect", "cflow.js"),
						dojo.moduleUrl("dojox.lang.aspect", "counter.js"),
						dojo.moduleUrl("dojox.lang.aspect", "memoizer.js"),
						dojo.moduleUrl("dojox.lang.aspect", "memoizerGuard.js"),
						dojo.moduleUrl("dojox.lang.aspect", "profiler.js"),
						dojo.moduleUrl("dojox.lang.aspect", "timer.js"),
						dojo.moduleUrl("dojox.lang.aspect", "tracer.js")
					]
				},
				"dojox.lang.functional":{
					requires:[
						"dojox.lang.functional",
						"dojox.lang.functional.array",
						"dojox.lang.functional.binrec",
						"dojox.lang.functional.curry",
						"dojox.lang.functional.fold",
						"dojox.lang.functional.lambda",
						"dojox.lang.functional.linrec",
						"dojox.lang.functional.listcomp",
						"dojox.lang.functional.multirec",
						"dojox.lang.functional.numrec",
						"dojox.lang.functional.object",
						"dojox.lang.functional.reversed",
						"dojox.lang.functional.scan",
						"dojox.lang.functional.sequence",
						"dojox.lang.functional.tailrec",
						"dojox.lang.functional.util",
						"dojox.lang.functional.zip"],
					files:[
						dojo.moduleUrl("dojox.lang", "functional.js"),
						dojo.moduleUrl("dojox.lang.functional", "array.js"),
						dojo.moduleUrl("dojox.lang.functional", "binrec.js"),
						dojo.moduleUrl("dojox.lang.functional", "curry.js"),
						dojo.moduleUrl("dojox.lang.functional", "fold.js"),
						dojo.moduleUrl("dojox.lang.functional", "lambda.js"),
						dojo.moduleUrl("dojox.lang.functional", "linrec.js"),
						dojo.moduleUrl("dojox.lang.functional", "listcomp.js"),
						dojo.moduleUrl("dojox.lang.functional", "multirec.js"),
						dojo.moduleUrl("dojox.lang.functional", "numrec.js"),
						dojo.moduleUrl("dojox.lang.functional", "object.js"),
						dojo.moduleUrl("dojox.lang.functional", "reversed.js"),
						dojo.moduleUrl("dojox.lang.functional", "scan.js"),
						dojo.moduleUrl("dojox.lang.functional", "sequence.js"),
						dojo.moduleUrl("dojox.lang.functional", "tailrec.js"),
						dojo.moduleUrl("dojox.lang.functional", "util.js"),
						dojo.moduleUrl("dojox.lang.functional", "zip.js")
					]
				},
				"dojox.atom.io.model.AtomItem":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.Category":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.Collection":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.Content":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.Entry":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.Feed":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.Generator":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.Link":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.Node":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.Person":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.Service":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.util":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model.Workspace":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model._actions":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.io.model._Constants":{requires:["dojox.atom.io.model"], files:[dojo.moduleUrl("dojox.atom.io", "model.js")]},
				"dojox.atom.widget.PeopleEditor":{requires:["dojox.atom.widget.FeedEntryEditor"], files:[dojo.moduleUrl("dojox.atom.widget", "FeedEntryEditor.js")]},
				"dojox.atom.widget.EntryHeader":{requires:["dojox.atom.widget.EntryHeader"], files:[dojo.moduleUrl("dojox.atom.widget", "EntryHeader.js")]},
				"dojox.atom.widget.FeedViewerEntry":{requires:["dojox.atom.widget.FeedViewer"], files:[dojo.moduleUrl("dojox.atom.widget", "FeedViewer.js")]},
				"dojox.atom.widget.FeedViewerGrouping":{requires:["dojox.atom.widget.FeedViewer"], files:[dojo.moduleUrl("dojox.atom.widget", "FeedViewer.js")]},
				"dojox.atom.widget.AtomEntryCategoryFilter":{requires:["dojox.atom.widget.FeedViewer"], files:[dojo.moduleUrl("dojox.atom.widget", "FeedViewer.js")]},
				"dojox.atom.widget.FeedViewer.CategoryIncludeFilter":{requires:["dojox.atom.widget.FeedViewer"], files:[dojo.moduleUrl("dojox.atom.widget", "FeedViewer.js")]},
				
				//
				// doh
				// 
				"doh":{requires:null, files:[]},
				"doh.robot":{
					requires:["doh.robot", "dojo.robot", "dojo.robotx"],
					files:[
						dojo.moduleUrl("util/doh", "robot.js"),
						dojo.moduleUrl("dojo", "robot.js"),
						dojo.moduleUrl("dojo", "robotx.js")
					]
				}
			}
		}
	);
	
	dools.docs.setup.dojo = new dools.docs.setup.Dojo();
})();
