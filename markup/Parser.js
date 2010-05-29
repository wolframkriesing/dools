dojo.provide("dools.markup.Parser");

dojo.declare("dools.markup.Parser", null,
{
	// TODO: write documentation
	// summary:
	//
	// description:
	//
	// returns:
	//
	
	constructor: function(/*Object*/ syntax){
		this.syntax = syntax;
	},

	parse: function(/*String*/ text){
		this.text = text;
		this.tokensStack = [];
		this.parentStack = [];

		// standardize line endings
		this.text = this.text.replace(/\r\n/g,"\n"); // DOS to Unix
		this.text = this.text.replace(/\r/g,"\n");   // Mac to Unix

		// make sure text begins and ends with a couple of newlines
		this.text = "\n\n\n" + this.text + "\n\n\n";

		// convert all tabs to spaces
		this.text = this._detab(this.text, 4);

		// call preProcess callback
		if(this.syntax.preProcess){
			this.syntax.preProcess(this.text);
		}

		while(this.text.length > 0){
			// check if one of end regexps matches
			if(this._searchEndPatterns())
				continue;

			// check if one of start regexps matches
			if(this._searchStartPatterns())
				continue;

			// Nothing matched, show a warning.
			console.warn('No items from syntax definition matched. Cutting one char from input text: "' + this.text + '"');

			// if nothing matches - just cut one char and put it to the stack
			var syntaxDef = { start: '[\\s\\S]',
							  mode: 'text',
							  token: dools.markup.TextToken };
			var match = this._matchAndCut(syntaxDef.start);
			var token = this._createToken(syntaxDef, match);
			var item  = {token: token, syntaxDef: syntaxDef, startMatch: match};

			var itemParent = this.parentStack[this.parentStack.length-1];
			if (itemParent){
				itemParent.children.push(item);
			}else{
				this.tokensStack.push(item);
			}
		}

		if(this.syntax.postProcess){
			this.syntax.postProcess(this.tokensStack);
		}

		this.lastTokens = [null];
		this.text = this._serializeTokensStack(this.tokensStack);

		return this.text;
	},

	_searchStartPatterns: function(){
		var itemParent = this.parentStack[this.parentStack.length-1];
		var item;

		for(var i = 0; i < this.syntax.tokens.length; i++){
			var syntaxDef = this.syntax.tokens[i];

			if(!this._checkAllowedChildren(syntaxDef.mode, itemParent)){
				continue;
			}

			if(syntaxDef.start){
				var match = this._matchAndCut(syntaxDef.start, syntaxDef.restoreStart);

				if(match){
					//invoke a callback
					if(dojo.isFunction(syntaxDef.onMatchStart))
						syntaxDef.onMatchStart(match, this.syntax);

					if(syntaxDef.end){
						item = {syntaxDef: syntaxDef, startMatch: match, endMatch: [''], children: []};
						this.parentStack.push(item);

					}else{
						if(syntaxDef.discard)
							return true;

						var token = this._createToken(syntaxDef, match, syntaxDef.create, match, ['']);
						item = {token: token, syntaxDef: syntaxDef, startMatch: match, endMatch: ['']}
					}

					// if it has a parent, add it to parent.
					if(itemParent){
						itemParent.children.push(item);
					}else{
						this.tokensStack.push(item);
					}

					if(!syntaxDef.restoreStart)
						return true;
					else
						itemParent = this.parentStack[this.parentStack.length-1];
				}
			}
		}

		return false;
	},

	_searchEndPatterns: function(){
		// check if one of end regexps matches
		for(var i = this.parentStack.length-1; i >= 0; i--){
			var item = this.parentStack[i];

			var syntaxDef = item.syntaxDef;
			var match = this._matchAndCut(syntaxDef.end, syntaxDef.restoreEnd);

			if(match){
				//invoke a callback
				if(dojo.isFunction(syntaxDef.onMatchEnd))
					syntaxDef.onMatchEnd(match, this.syntax);

				// would be pop, but we allow 'tag soup' as it were.
				this.parentStack.splice(i, 1);

				// stash the end match
				item.endMatch = match;

				return true;
			}
		}

		return false;
	},

	_createToken: function(/*Object*/ syntaxDef,
						   /*String*/ value,
						   /*Function?*/ create,
						   /*Array?*/ startMatch,
						   /*Array?*/ endMatch){
		var defaultCreate = function(value){
			return new syntaxDef.token(value, this.args);
		}
		var create = create || defaultCreate;
		return create.call(syntaxDef, value, startMatch || [''], endMatch || [''], this.syntax);
	},

	_matchAndCut: function(/*String*/ pattern, /*Array?*/ restore){
		var re = new RegExp("^"+pattern);
		var match = re.exec(this.text);

		if(match && match[0].length > 0){
			this.text = this.text.substr(match[0].length, this.text.length);
			if(restore)
				for(var i = restore.length-1; i >= 0; i--)
					if( match[restore[i]] )
						this.text = match[ restore[i] ] + this.text;
			return match;
		}
		return null;
	},

	// restores original text that corresponds to given stackToken
	_restoreText: function(/*Array*/ stackToken){
		var text = stackToken.startMatch[0];
		if(stackToken.children && stackToken.children.length > 0){
			for(var i = 0; i < stackToken.children.length; i++){
				text += this._restoreText(stackToken.children[i]);
			}
		}
		return text + stackToken.endMatch[0];
	},

	_checkAllowedChildren: function(/*String*/ mode, /*Object*/ itemParent){
		var allowedChildren = (itemParent && itemParent.syntaxDef.allowedChildren) ? itemParent.syntaxDef.allowedChildren : this.syntax.allowedChildren;

		if(mode && allowedChildren){
			for(var i = 0; i < allowedChildren.length; i++){
				if(mode == allowedChildren[i]){
					return true;
				}
			}
		}else{
			return true;
		}
		return false;
	},

	// converts the token stream into HTML.
	_serializeTokensStack: function(/*Array*/ tokensStack, /*Object?*/ parentToken, /*int?*/ level){
		if(!tokensStack || tokensStack.length == 0){
			return '';
		}

		var html = '';
		var level = level || 0;

		for(var i = 0; i < tokensStack.length; i++){
			var stackToken = tokensStack[i];
			if(stackToken.syntaxDef.discard)
				continue;

			var token = stackToken.token;
			var lastToken = (this.lastTokens && this.lastTokens[level]) ? this.lastTokens[level] : null;

			if(!token){
				// don't create token with empty value, just restore original text instead
				if(!stackToken.children || stackToken.children.length == 0){
					token = this._createToken( {token: dools.markup.TextToken}, this._restoreText(stackToken) );
				}else{
					//token = this._createToken(stackToken.syntaxDef, '', stackToken.syntaxDef.create, stackToken.startMatch, stackToken.endMatch);
					//token.innerHtml = this._serializeTokensStack(stackToken.children, token, level+1);

					// FIXME: IMPORTANT!
					// this is a very bad workaround
					// the same create() and token constructor are called twice
					//
					// at first token is created because _serializeTokensStack() requires a parentToken parameter (but token recieves '' as innerHtml)
					// _serializeTokensStack() returns innerHtml for a "real token"
					// and then token is again created with valid innerHtml parameter
					token = this._createToken(stackToken.syntaxDef, '', stackToken.syntaxDef.create, stackToken.startMatch, stackToken.endMatch);
					token.innerHtml = this._serializeTokensStack(stackToken.children, token, level+1);
					token = this._createToken(stackToken.syntaxDef, token.innerHtml, stackToken.syntaxDef.create, stackToken.startMatch, stackToken.endMatch);
				}
			}


			// helper function for more code reuse
			var closeGroups = function(level, lastTokens){
				var html = '';
				for(var j = lastTokens.length-1; j > level; j--){
					html += (lastTokens[j] && lastTokens[j].grouped) ? lastTokens[j].endGroup() : '';
					lastTokens[j] = null;
				}
				return html;
			}

			if(!lastToken || lastToken.declaredClass != token.declaredClass){
				if(lastToken && lastToken.grouped){
					//close all inner groupes first
					html += closeGroups(level, this.lastTokens);
					html += lastToken.endGroup();
				}
				if(token.grouped){
					html += token.startGroup();
				}
			}

			html += token.toHtml();

			this.lastTokens[level] = token;
		}

		// close current and all inner groups if parent token is not grouped
		if(!parentToken || !parentToken.grouped || parentToken.hasGroupItemTag()){
			html += closeGroups(level-1, this.lastTokens);
		}

		return html;
	},

	// convert tabs to spaces
	_detab: function(/*String*/ text, /*int*/ tabWidth){
		var spaces = "";
		for(var i = 0; i < tabWidth; i++)
			spaces += " ";
		return text.replace(/\t/g, spaces);
	}
});

// Base class for all tokens
dojo.declare('dools.markup._AbstractToken', null, {
	constructor: function(value, args){
		// value: Array|String
		//     Value which is used by tokens to generate output text.
		// args.grouped?: boolean
		//     Set true to mark token as grouped, the default is false.
		// args.startGroupText?: String
		//     Text to put before start of the group.
		// args.endGroupText?: Array
		//     Text to put after end of the group.
		this.args = args || {};
		if(dojo.isArray(value)){
			this.value = value[0];
		}else{
			this.value = value || '';
		}
		this.grouped = (this.args.grouped !== undefined) ? this.args.grouped : (this.grouped || false);
		this.startGroupText = this.args.startGroupText || this.startGroupText || '';
		this.endGroupText = this.args.endGroupText || this.endGroupText || '';
	},
	startGroup:function(){
		return this.startGroupText;
	},
	endGroup:function(){
		return this.endGroupText;
	}
});

// Base class for all Html tokens
dojo.declare('dools.markup._HtmlTagToken', dools.markup._AbstractToken, {
	constructor: function(value, args){
		// args.tagName?: String
		//     Name of html tag.
		// args.groupTagName?: String
		//     Name of html tag to surround grouped tokens.
		//     If not defined - args.tagName will be used instead.
		// args.single?: boolean
		//     Set true to create single tag.
		//     Single tag is a tag which ends with " />" (eg <br />, not <br></br>).
		// args.innerHtml?: String
		//     Text to put inside a tag.
		//     If not defined - *value* will be used instead.
		// args.attrs?: Object
		//     Object which contains attributes of html tag.
		//     Eg
		//        { title: "Title here", style: "color:#eee" }
		//     will be converted to:
		//        title="Title here" style="color:#eee"
		// args.groupAttrs?: Object
		//     The same as args.attrs but applies to group tag.
		//     If not defined - args.attrs will be used instead.
		this.tagName      = this.args.tagName || this.tagName;
		this.innerHtml    = this.args.innerHtml || this.value;
		this.groupTagName = this.args.groupTagName || this.groupTagName;
		this.attrs        = this.args.attrs || this.attrs || {};
		this.groupAttrs   = this.args.groupAttrs || this.groupAttrs;
		this.single       = this.args.single || this.single || false;
	},
	attrsToText: function(attrs){
		if(dojo.isString(attrs))
			return attrs;

		var text = '';
		for(var attrName in attrs)
			text += (attrs[attrName]) ? ' '+ attrName +'="'+ attrs[attrName] +'"' : '';
		return text;
	},
	startGroup: function(){
		var groupTagName = this.groupTagName || this.tagName;
		var groupAttrs   = this.groupAttrs || (!this.groupTagName ? this.attrs : {});
		return groupTagName ? '<'+ groupTagName + this.attrsToText(groupAttrs) +'>' : '';
	},
	endGroup: function(){
		var groupTagName = this.groupTagName || this.tagName;
		return groupTagName ? '</'+ groupTagName +'>' : '';
	},
	// FIXME: bad name and logic
	hasGroupItemTag: function(){
		// description:
		//     Returns true if token generates tags for both group and inner items.
		//     For example, in unordered list:
		//       generates <ul> as group tag
		//       generates <li> as item tag for each group item
		return this.tagName && this.groupTagName && this.grouped;
	},
	toHtml: function(){
		if(this.tagName && !this.single &&
		   (!this.grouped || (this.grouped && this.groupTagName)) && // create tag only if this.tagName is NOT used as groupTagName
		   this.innerHtml) // and we have a text to put inside a tag
			return '<'+ this.tagName + this.attrsToText(this.attrs) +'>'+ this.innerHtml +'</'+ this.tagName +'>';
		else if(this.tagName && this.single)
			return '<'+ this.tagName + this.attrsToText(this.attrs) +' />';
		else
			return this.value || this.innerHtml;
	}
});


dojo.declare('dools.markup.CodeToken', dools.markup._HtmlTagToken, {
	tagName: "code",
	constructor: function(value, args){
		// args.encodeCode?: boolean
		//     Whether to encode special html chars (& to &amp; < to &lt; > to &gt;) or not.
		//     The default is true.
		this.encodeCode = this.args.encodeCode || this.encodeCode;
	},
	toHtml: function(){
		if(this.encodeCode !== false){
			// Encode all ampersands; HTML entities are not
			// entities within a code span.
			this.innerHtml = this.innerHtml.replace(/&/g,"&amp;");

			// Do the angle bracket song and dance:
			this.innerHtml = this.innerHtml.replace(/</g,"&lt;");
			this.innerHtml = this.innerHtml.replace(/>/g,"&gt;");
			this.value = this.innerHtml;
		}
		// call parent toHtml()
		return dools.markup.CodeToken.superclass.toHtml.call(this);
	}
});

dojo.declare('dools.markup.PreToken', dools.markup.CodeToken, {tagName: "pre", encodeCode: false});

dojo.declare('dools.markup.PreCodeToken', dools.markup.CodeToken, {
	grouped: true,
	startGroup: function(){
		return "<pre><code>";
	},
	endGroup: function(){
		return "</code></pre>";
	}
});

dojo.declare('dools.markup.HeaderToken', dools.markup._HtmlTagToken, {
	constructor: function(value, args){
		// args.level?: Integer
		//    Header level (1-6). The default is 1
		this.tagName = this.tagName || "h" + (this.args.level || 1);
	}
});

dojo.declare('dools.markup.LinkToken', dools.markup._HtmlTagToken, {
	tagName: "a",
	encodeAddr: function(str){
		// --
		// This function is based on _EncodeEmailAddress() from Showdown
		// (<http://www.attacklab.net/>)
		// --
		//
		//  Input: an email address, e.g. "foo@example.com"
		//
		//  Output: the email address as a mailto link, with each character
		//	of the address encoded as either a decimal or hex entity, in
		//	the hopes of foiling most address harvesting spam bots. E.g.:
		//
		//	<a href="&#x6D;&#97;&#105;&#108;&#x74;&#111;:&#102;&#111;&#111;&#64;&#101;
		//	   x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;">&#102;&#111;&#111;
		//	   &#64;&#101;x&#x61;&#109;&#x70;&#108;&#x65;&#x2E;&#99;&#111;&#109;</a>
		//
		//  Based on a filter by Matthew Wickline, posted to the BBEdit-Talk
		//  mailing list: <http://tinyurl.com/yu7ue>
		//

		// attacklab: why can't javascript speak hex?
		function char2hex(ch){
			var hexDigits = '0123456789ABCDEF';
			var dec = ch.charCodeAt(0);
			return(hexDigits.charAt(dec>>4) + hexDigits.charAt(dec&15));
		}

		var encode = [
			function(ch){return "&#"+ch.charCodeAt(0)+";";},
			function(ch){return "&#x"+char2hex(ch)+";";},
			function(ch){return ch;}
		];

		str = str.replace(/./g, function(ch){
			if(ch == "@"){
				// this *must* be encoded. I insist.
				ch = encode[Math.floor(Math.random()*2)](ch);
			}else{
				// leave ':' alone (to spot mailto: later)
				var r = Math.random();
				// roughly 10% raw, 45% hex, 45% dec
				ch = (
					   r > 0.9  ? encode[2](ch) :
					   r > 0.45 ? encode[1](ch) :
								 encode[0](ch)
					  );
			}
			return ch;
		});

		return str;
	},
	toHtml: function(){
		// args.encode?: boolean
		//    If true then link text and href will be encoded.
		//    Used to encode email addresses in the hopes of foiling
		//    most address harvesting spam bots.
		//    The default is false.
		if(this.args.encode){
			// encode href and link text
			this.attrs.href = this.encodeAddr(this.attrs.href);
			this.innerHtml = this.encodeAddr(this.innerHtml);
		}
		// replace " with &quot; in title
		if(this.attrs.title){
			this.attrs.title = this.attrs.title.replace(/"/g,"&quot;");
		}
		// call parent toHtml()
		return dools.markup.LinkToken.superclass.toHtml.call(this);
	}
});

dojo.declare('dools.markup.ReferenceLinkToken', dools.markup.LinkToken, {
	constructor: function(value, args){
		// args.linkId: String
		//     Unique identifier of the link
		// args.attrsStorage: Array
		//     External storage, where all attributes of link with specified linkId are stored
		if(!this.args.linkId || !this.args.attrsStorage)
			return;

		if(!this.args.attrsStorage[this.args.linkId])
			this.args.attrsStorage[this.args.linkId] = {};

		// merge
		for(var attrName in this.attrs)
			this.args.attrsStorage[this.args.linkId][attrName] = this.attrs[attrName];
	},
	toHtml: function(){
		// reverse merge
		for(var attrName in this.args.attrsStorage[this.args.linkId])
			this.attrs[attrName] = this.args.attrsStorage[this.args.linkId][attrName];

		if(this.tagName && this.value && this.attrs.href)
			return '<'+ this.tagName + this.attrsToText(this.attrs) +'>'+ this.innerHtml +'</'+ this.tagName +'>';
		else
			return this.value || this.innerHtml;
	}
});

dojo.declare('dools.markup.ListItemToken', dools.markup._HtmlTagToken, {
	grouped: true,
	tagName: "li",
	groupTagName: "ul",
	constructor: function(value, args){
		// args.ordered?: boolean
		//     Set true to create ordered list <ol> or false to create unordered list <ul>.
		//     The default is false.
		if(this.args.ordered)
			this.groupTagName = "ol";
	}
});
dojo.declare('dools.markup.UnorderedListToken', dools.markup._HtmlTagToken, {tagName: "ul"});
dojo.declare('dools.markup.OrderedListToken', dools.markup._HtmlTagToken, {tagName: "ol"});

dojo.declare('dools.markup.ParagraphToken', dools.markup._HtmlTagToken, {tagName: "p"});
dojo.declare('dools.markup.BlockquoteToken', dools.markup._HtmlTagToken, {tagName: "blockquote"});
dojo.declare('dools.markup.TableToken', dools.markup._HtmlTagToken, {tagName: "table"});
dojo.declare('dools.markup.TableRowToken', dools.markup._HtmlTagToken, {tagName: "tr"});
dojo.declare('dools.markup.TableHeaderToken', dools.markup._HtmlTagToken, {tagName: "th"});
dojo.declare('dools.markup.TableDataToken', dools.markup._HtmlTagToken, {tagName: "td"});
dojo.declare('dools.markup.ImageToken', dools.markup._HtmlTagToken, {tagName: "img", single: true});
dojo.declare('dools.markup.HorizontalRuleToken', dools.markup._HtmlTagToken, {tagName: "hr", single: true});
dojo.declare('dools.markup.LineBreakToken', dools.markup._HtmlTagToken, {tagName: "br", single: true});

dojo.declare('dools.markup.EmphasisToken', dools.markup._HtmlTagToken, {tagName: "em"});
dojo.declare('dools.markup.StrongToken', dools.markup._HtmlTagToken, {tagName: "strong"});
dojo.declare('dools.markup.ItalicToken', dools.markup._HtmlTagToken, {tagName: "i"});
dojo.declare('dools.markup.BoldToken', dools.markup._HtmlTagToken, {tagName: "b"});
dojo.declare('dools.markup.CitationToken', dools.markup._HtmlTagToken, {tagName: "cite"});
dojo.declare('dools.markup.DeletedToken', dools.markup._HtmlTagToken, {tagName: "del"});
dojo.declare('dools.markup.InsertedToken', dools.markup._HtmlTagToken, {tagName: "ins"});
dojo.declare('dools.markup.SuperscriptToken', dools.markup._HtmlTagToken, {tagName: "sup"});
dojo.declare('dools.markup.SubscriptToken', dools.markup._HtmlTagToken, {tagName: "sub"});
dojo.declare('dools.markup.SpanToken', dools.markup._HtmlTagToken, {tagName: "span"});

dojo.declare('dools.markup.TextToken', dools.markup._HtmlTagToken, {
	toHtml: function(){
		return this.innerHtml;
	}
});

// vim:ts=4:et:tw=0:
