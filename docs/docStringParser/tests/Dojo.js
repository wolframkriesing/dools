dojo.provide("dools.docs.tests.DojoDocStringParser");

dojo.require("dools.docs.DojoDocStringParser");
tests.registerDocTests("dools.docs.DojoDocStringParser");



//tests.register("dools.docs.tests.FileParser", 
//	[
//		function test_lineNumber(t){
//			// summary: Verify the line number where the d.query() method
//			// 		above is defined.
//			// description: This test used to fail, because the leading new
//			// 		lines had been subtracted. Fixed now.
//			var fp = new dools.docs.FileParser("dools.docs.tests.FileParser");
//			fp.load();
//			t.assertEqual(13, fp.getMethodData(["query"]).query.lineNumber);
//		},
//		function test_numLines(t){
//			// summary: 
//			var fp = new dools.docs.FileParser("dools.docs.tests.FileParser");
//			fp.load();
//			t.assertEqual(3, fp.getMethodData(["query"]).query.numLines);
//		},
//	]
//);