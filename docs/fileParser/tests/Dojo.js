dojo.provide("dools.docs.fileParser.tests.Dojo");

dojo.require("dools.docs.fileParser.Dojo");
dojo.require("dools.docs.objectInfo.Dojo");
tests.registerDocTests("dools.docs.fileParser.Dojo");




// THIS LINE MUST be on LINE 10!!!!!!! in order to make the tests below work, they check the line number of the following.
(function(){
	var d = {};
	d.query = function(){
		// some code here
	}
})();

tests.register("dools.docs.tests.fileParser.Dojo", 
	[
		function test_lineNumber(t){
			// summary: Verify the line number where the d.query() method
			// 		above is defined.
			// description: This test used to fail, because the leading new
			// 		lines had been subtracted. Fixed now.
			var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.tests.Dojo");
			fp.load();
			t.assertEqual(13, fp.getMethodData(["query"]).query.lineNumber);
		},
		function test_numLines(t){
			// summary: Test that the length of the method is returned properly.
			var fp = new dools.docs.fileParser.Dojo("dools.docs.fileParser.tests.Dojo");
			fp.load();
			t.assertEqual(3, fp.getMethodData(["query"]).query.numLines);
		},
	]
);
//*/