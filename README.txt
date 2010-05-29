This directory hierarchy assumes that the "dools" directory is a sibling of a
"dojo" directory which contains Dojo core, a "dijit" directory that provides
widgets, etc.

If starting from scratch but want to work from anonymous Dojo SVN, you should
achieve the right layout with:

	%> svn co http://svn.dojotoolkit.org/src/view/anon/all/trunk/ dojoRoot
	...
	%> cd dojoRoot
	%> svn co http://dools.googlecode.com/svn/trunk/dools dools
	...
	%> ls
	.svn/
	demos/
	dijit/
	dojo/
	dojox/
	dools/
	util/
