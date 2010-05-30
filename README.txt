Try it out
===========
Open this page in your browser
		http://.../dools/app/apidoc/dojo/

Run the tests
==============
Inside the dools directory are a couple of test directories, not all tests pass yet, so there is still some stuff
to do, if you feel like go ahead and fix stuff.
		http://.../dools/docs/docStringParser/tests/runTests.html
		http://.../dools/docs/fileParser/tests/runTests.html
		http://.../dools/docs/fileParser/tests/runTests.html

Run the demos
==============
A couple of widgets, which form the base of the app:apidoc can be tried out here:
		http://.../dools/docs/widget/demos/
there you can see how the classes are supposed to be used.


This directory hierarchy assumes that the "dools" directory is a sibling of a
"dojo" directory which contains Dojo core, a "dijit" directory that provides
widgets, etc.

If starting from scratch but want to work from anonymous Dojo SVN, you should
achieve the right layout with:


****the following I didnt try it out yet******

Using svn
==========

	%> mkdir dools
	%> cd dools
	%> svn co http://svn.dojotoolkit.org/src/dojo/trunk dojo
	%> svn co http://svn.dojotoolkit.org/src/dijit/trunk dijit
	%> svn co http://svn.dojotoolkit.org/src/dojox/trunk dojox
	%> svn co http://svn.dojotoolkit.org/src/util/trunk util     # You need this to run the tests.
	%> svn co http://svn.github.com/wolframkriesing/dools.git dools
	...
	%> ls
	dijit/
	dojo/
	dojox/
	dools/
	util/

Using git
==========

	%> mkdir dools
	%> cd dools
	%> git svn clone http://svn.dojotoolkit.org/src/dojo/trunk dojo
	%> git svn clone http://svn.dojotoolkit.org/src/dijit/trunk dijit
	%> git svn clone http://svn.dojotoolkit.org/src/dojox/trunk dojox
	%> git svn clone http://svn.dojotoolkit.org/src/util/trunk util
	%> git svn clone http://svn.github.com/wolframkriesing/dools.git
	...
	%> ls
	dijit/
	dojo/
	dojox/
	dools/
	util/
