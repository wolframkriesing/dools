dojo.provide("dools.docs.docStringParser.Dojo");

dojo.require("dools.docs.docStringParser._base");

// for the parsing of the example/description blocks
// load dools.markup.parser
dojo.require("dools.markup.Parser");

// we need the markdown definition:
dojo.require("dools.markup.language.Markdown");

dojo.declare(
	"dools.docs.docStringParser.Dojo",
	dools.docs.docStringParser._base,
	{
		// summary: A DocString parser for the Dojo DocStrings.
		// description:
		//		This is a specific DocString parser for Dojo. It separates the defintion blocks
		//		like summary, description, example and all attribute defintions. A summary block
		//		looks like this, e.g.:
		//		|    summary:
		//		|        my summary
		//		Also all description and example blocks are converted to HTML using the Markdown 
		//		syntax.
		// examples:
		//		>>> var p = new dools.docs.docStringParser.Dojo(); // The simplest case with two blocks.
		//		>>> dojo.toJson(p.parseClassDocString("summary: whatever.\nend: nooot"))
		//		"{"summary":"whatever.","end":"nooot"}"
		//
		//		>>> var p = new dools.docs.docStringParser.Dojo(); // Multiple line blocks.
		//		>>> dojo.toJson(p.parseClassDocString("summary: whatever.\n line2"))
		//		"{"summary":"whatever.\nline2"}"
		//
		//		>>> var p = new dools.docs.docStringParser.Dojo(); // Same block multiple times with multiple lines.
		//		>>> dojo.toJson(p.parseClassDocString("summary: whatever.\n summary: line2 \n line3"))
		//		"{"summary":["whatever.","line2\nline3"]}"
		//
		//		>>> var p = new dools.docs.docStringParser.Dojo(); // Same block multiple times with multiple lines.
		//		>>> dojo.toJson(p.parseClassDocString("summary: whatever.\n end:nix\n summary: line2 \n line3\nend:foo"))
		//		"{"summary":["whatever.","line2\nline3"],"end":["nix","foo"]}"
		//
		//		>>> var p = new dools.docs.docStringParser.Dojo(); // Ensure all lines are trimmed.
		//		>>> dojo.toJson(p.parseClassDocString("summary: line1\n\t\tline 2\n\tline 3"))
		//		"{"summary":"line1\nline 2\nline 3"}"

		
		// markupParser: object
		//		where we declare our parser for the markdown markup
		markupParser:null,
		blockParserConfig:{
			searchKeyRegExp:/^\s*([a-zA-Z]+)\s*:/,
			replaceKeyRegExp:"\\s*{key}\\s*:"
		},
		
		constructor:function(){
			// needed for parsing Markdown blocks
			var markupSyntax = new dools.markup.language["Markdown"];
			this.markupParser = new dools.markup.Parser(markupSyntax);
		},
		
		parsePropertyDocString:function(docString, propertyName){
			var parsedString = this.inherited(arguments);
			// we have to split the first line, it contains the property type
			// e.g.:
			//   String
			//   This is the description of this property
			//   using more than one line
			if(parsedString[propertyName]){
				var splitVal = parsedString[propertyName].split("\n"),
					ret = {
						datatype:splitVal.shift(),
						summary:this.markupParser.parse(splitVal.join("\n"))
					};
				return ret;
			}
			return {};
		},
		
/*		_parseDocBlock:function(docString){
 put this back in but do it right ... this looks hacky
				if (key){
					// example-code-blocks can sometimes contain | at the beginning: remove those
					// we also have to add an additional newline in front of every codeblock. otherwise it is not parsed
					// by markdown as a codeblock
					line = dojo.string.trim(line);
					if(line.indexOf("|")===0){
						line = line.substring(1);
						if(! firstPipeFound){
							line = "\n" + line;
							firstPipeFound = true;
						}
						endOfPipes = false;
					}else{
						endOfPipes = true;
						firstPipeFound = false;
					}
				}
*/
	}
);