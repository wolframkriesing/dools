dojo.provide("dools.docs.objectInfo._base");

dojo.declare(
	"dools.docs.objectInfo._base",
	null,
	{
		// summary:
		//		All the info about an inspectable object, as used for the docs.
		// description:
		//		Not always it is as easy as with most dojo objects, that
		//		"dojo.array" matches "dojo/array.js" and that the object is accessible
		//		via "dojo.array". This object provides all the info about an
		//		inspectable object, wether it is an object, class or method.
		
		// id: string|int|etc.
		// 		A unique identifier for referring e.g. to the information
		// 		the dools.docs.setup object has about filenames, etc.
		// 		The content, it's type doesn't matter to this class.
		// 		Mostly though it's the same as `this.objectName`.
		//
		// 		E.g. for dojo it may be something like "dojo.query", which uniquely
		// 		maps directly to the object (in this case a method) that we want
		// 		to get info about.
		// 		In the PhoneGap case it might be "android.Accelerometer" though
		// 		the object's name is only "Accelerometer", but for uniqueness esp.
		// 		to map the info stored in dools.docs.setup we need to prefix it,
		// 		since there is also "blackberry.Accelerometer" and "iphone.Accelerometer"
		// 		etc. but their objects are always "Accelerometer". So this `id`
		// 		is an artifical thing in that case.
		id:"",
		
		// objectName: string
		// 		The name of the object and how it can be referenced.
		// 		For really working with this object call `getReflectableObject()`
		// 		of this class.
		objectName:"",
		
		methodName:"",
		
		// docSyntax: string
		// 		A string that identifies the kind of syntax the JS docs are written in.
		// 		E.g. "dojo" is the dojo-doc style, which is different than the JsDoc style, see
		// 		more details at http://o.dojotoolkit.org/developer/StyleGuide
		// 		Depending on what is implenented in dools you can choose at least from the following:
		// 			"dojo" and "jsDoc".
		docSyntax:"",
		
		setupObject:null,
		
		constructor:function(params) {
			// summary:
			// 		Create a instance for one object to inspect.
			// description:
			// 		Call the constructor with either just a string, which is
			// 		the objectInfoId (mostly the same as the className), or an
			// 		object which gets mixed into 'this'.
			// example:
			// 		Call it with just an ID.
			// 			var o = new dools.docs.objectInfo.dojo("dojo.html");
			// 		Call it with various data.
			// 			var o = new dools.docs.objectInfo.dojo({id:"android.accelerometer", objectName:"Acceleromter"});
			if (dojo.isString(params)){
				params = {id:params, objectName:params};
			}
			dojo.mixin(this, params);
			if (!(""+this.id)){ // Is `this.id` not given? (exclude also the number 0, that's why the string cast).
				var m = this.methodName;
				this.id = this.objectName + ( m ? "."+m : "" );
			}
			this.setupObject = dools.docs.setup[this.docSyntax];
		},
		
		getReflectableObject:function(){
			// summary:
			// 		Returns an object that we can run a Reflection on.
			// description:
			// 		Sometimes it is necessary to create an instance of the
			// 		object that we want to inspect, e.g. because the class/object
			// 		only defines properties using "this.x = ..." notation inside
			// 		the constructor function, or stuff alike. (In that case we need to execute the constructor!)
			// 		Mostly though (like most dojo object) the class/object can
			// 		be returned as is.
			return this._getReflectableObject();
		},
		
		_reflectableObject:null,
		_getReflectableObject:function(){
			// Is it already cached?
			if (this._reflectableObject==null){
				//var m = this.methodName; // Add the methodName if given.
				//this._reflectableObject = dojo.getObject(this.objectName + ( m ? "."+m : "" ));
				this._reflectableObject = dojo.getObject(this.objectName);
				if (typeof this._reflectableObject=='function'){
					// If the reflectable object is a function, let's try to instanciate it.
					// Good idea?
					this._reflectableObject = new this._reflectableObject;
				}
			}
			return this._reflectableObject;
		}
	}
);