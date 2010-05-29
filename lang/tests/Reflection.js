dojo.provide("dools.lang.tests.Reflection");

dojo.require("dools.lang.Reflection");

tests.registerDocTests("dools.lang.Reflection");

var staticTestObject = {
	func:function(){}
};
dojo.declare("classA", null, {
	methA:function(){
		return "methA"
	},
	methA1:function(){
		return "methA1"
	}
})
dojo.declare("classB", classA, {
	methA:function(){
		return "methB"
	}
})

tests.register("dools.lang.tests.Reflection", 
	[
		function test_isInheritedStatic(t){
			// summary: Verify that for a static method that is not inherited "false" is returned.
			// 		It used to be undefined. (fixed)
			var r = new dools.lang.Reflection("staticTestObject");
			t.assertEqual(false, r.getMethods().func.isInherited);
		},
		function test_isInheritedInstance(t){
			// summary: Verify that a class method that is not inherited gives "false".
			var r = new dools.lang.Reflection("classA");
			t.assertEqual(false, r.getMethods().methA.isInherited);
		},
		function test_isInheritedInstance1(t){
			// summary: Test an inherited method of a dojo.declare()d class.
			var r = new dools.lang.Reflection("classB");
			t.assertEqual(true, r.getMethods(true).methA1.isInherited);
		},
		
		function test_isOverriddenStatic(t){
			var r = new dools.lang.Reflection("staticTestObject");
			t.assertEqual(false, r.getMethods(true).func.isOverridden);
		},
		function test_isOverriddenInstance(t){
			var r = new dools.lang.Reflection("classB");
			t.assertEqual(true, r.getMethods(true).methA.isOverridden);
		},
		//
		//function test_string_substitute(t){
		//	t.is("File 'foo.html' is not found in directory '/temp'.", 
		//		dojo.string.substitute(
		//			"File '${0}' is not found in directory '${1}'.", 
		//			["foo.html","/temp"]
		//		)
		//	);
		//	t.is("File 'foo.html' is not found in directory '/temp'.", 
		//		dojo.string.substitute(
		//			"File '${name}' is not found in directory '${info.dir}'.",
		//			{
		//				name: "foo.html",
		//				info: { dir: "/temp" }
		//			}
		//		)
		//	);
		//	// Verify that an error is thrown!
		//	t.assertError(Error, dojo.string, "substitute", ["${x}", {y:1}]);
		//},
	]
);
