dojo.provide("dools.docs.fileParser.tests.JsDoc");

dojo.require("dools.docs.fileParser.JsDoc");
dojo.require("dools.docs.objectInfo.JsDoc");
tests.registerDocTests("dools.docs.fileParser.JsDoc");


(function(){
	/**
	 * My test class, just for testing, yo.
	 * @constructor
	 */
	var d = function(){
		/**
		 * The prop with nix in it.
		 */
		this.prop = "nix";
	};
	
	/**
	 * A JsDoc style comment.
	 *
	 */
	d.query = function(query, context){
		
		
		
	}
	
	/**
	 * This class provides access to the device camera.
	 * @constructor
	 */
	function Camera() {
		// Stolen as example from phonegap :-)
	}
	
})();

// This is required for every setup.
dools.docs.setup.jsDoc.require = function(){
	// Nothing to do ...
}

tests.register("dools.docs.tests.fileParser.JsDoc", 
	[
		//
		//	getMethodData() tests
		//
		function test_getMethodData_docString(t){
			// summary:
			// 		Verify that we find a docString.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc");
			fp.load();
			t.assertEqual("A JsDoc style comment.", fp.getMethodData(["query"]).query.docString.split("\n")[0]);
		},
		function test_getMethodData_lineNumber(t){
			// summary:
			// 		Verify the line number where the d.query() method above is defined.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc");
			fp.load();
			t.assertEqual(24, fp.getMethodData(["query"]).query.lineNumber);
		},
		function test_getMethodData_numLines(t){
			// summary:
			// 		Test that the length of the method is returned properly.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc");
			fp.load();
			t.assertEqual(5, fp.getMethodData(["query"]).query.numLines);
		},
		function test_getMethodData_returnsArray(t){
			// summary:
			// 		Return an array from this method, if class was instanciated without a method name.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc");
			fp.load();
			t.assertEqual("object", typeof fp.getMethodData(["getClassDocString"]).getClassDocString);
		},
		function test_getMethodData_fileName(t){
			// summary:
			// 		Verify filename.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc", "query");
			fp.load();
			t.assertTrue(!!fp.getMethodData().fileName.match(/fileParser\/tests\/JsDoc\.js$/));
		},
		function test_getMethodData_sourceCode(t){
			// summary:
			// 		Check that the 'sourceCode' property is not empty.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc", "query");
			fp.load();
			t.assertTrue(!!fp.getMethodData().sourceCode);
		},
		function test_getMethodData_sourceCode1(t){
			// summary:
			// 		Check that 'sourceCode' contains as much lines as 'numLines' does and > 0, for "getClassDocString".
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc", "query");
			fp.load();
			var methodData = fp.getMethodData();
			t.assertTrue(methodData.numLines>0, "numLines is 0");
			t.assertEqual(methodData.numLines, methodData.sourceCode.split("\n").length);
		},
		function test_getMethodData_parameters(t){
			// summary:
			// 		Check that the 'parameters' property is properly read.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc", "query");
			fp.load();
			var methodData = fp.getMethodData();
			t.assertEqual(2, methodData.parameters.length);
			t.assertEqual("query,context", methodData.parameters[0].name+","+methodData.parameters[1].name);
		},
		
		
		//
		//	getPropertyData() tests
		//
		function test_props_all(t){
			// summary:
			// 		Verify that we find the prop and all its data properly.
			var fp = new dools.docs.fileParser.JsDoc("dools.docs.fileParser.tests.JsDoc");
			fp.load();
			var p = fp.getPropertyData(["prop"]).prop;
			var expected = '{"lineNumber":17,"fileName":"../../dools/docs/fileParser/tests/JsDoc.js","docString":"The prop with nix in it."}';
			t.assertEqual(expected, dojo.toJson(p));
		},
		
		//
		//	getClassDocString() tests
		//
		function test_classDocsCase1(t){
			// summary:
			// 		Verify that we find the prop and all its data properly.
			dools.docs.setup.jsDoc.module2FilesMap = {
				"Camera":{
					files:[dojo.moduleUrl("dools.docs.fileParser.tests", "JsDoc.js")]
				}
			};
			var fp = new dools.docs.fileParser.JsDoc("Camera");
			fp.load();
			var c = fp.getClassDocString();
			var expected = "This class provides access to the device camera.\n@constructor";
			t.assertEqual(expected, c);
		},
		function test_classDocsCase2(t){
			// summary:
			// 		Verify that we find the prop and all its data properly.
			dools.docs.setup.jsDoc.module2FilesMap = {
				"d":{
					files:[dojo.moduleUrl("dools.docs.fileParser.tests", "JsDoc.js"),]
				}
			};
			var fp = new dools.docs.fileParser.JsDoc("d");
			fp.load();
			var c = fp.getClassDocString();
			var expected = "My test class, just for testing, yo.\n@constructor";
			t.assertEqual(expected, c);
		},
		
	]
);
//*/