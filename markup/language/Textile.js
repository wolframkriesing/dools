dojo.provide("dools.markup.language.Textile");


(function(){

	// reusable regexps
	var hAlignRe  = '(?:<(?!>)|>|<>|=|[()]+(?! ))';
	var vAlignRe  = '[\\-^~]';
	var classRe   = '(?:\\([^)]+\\))';
	var styleRe   = '(?:\\{[^}]+\\})';
	var langRe    = '(?:\\[[^\\]]+\\])';
	var colspanRe = '(?:\\\\\\d+)';
	var rowspanRe = '(?:\\/\\d+)';

	var alignRe = '(?:'+ hAlignRe +'|'+ vAlignRe +')*';
	var colspanRowspanRe  = '(?:'+ colspanRe +'|'+ rowspanRe +')*';
	var classStyleLangAlignRe = '(?:'+ classRe +'|'+ styleRe +'|'+ langRe +'|'+ hAlignRe +')*';

	var urlchRe = '[\\w"$\\-_.+!*\'(),";\\/?:@=&%#{}|\\\\^~\\[\\]`]';

	var blockDef = function(pattern, extra){
		if(!extra)
			extra = {};

		// start and end for usual block
		var start = '('+ pattern +')'+ // do not use "(...)" inside of pattern, use "(?:...)" instead
					'('+ alignRe + classStyleLangAlignRe + ')'+
					'\\.'+
					'(?::(\\S+))? (?=.+)';
		var end = '\\s*(\n)(?=\n)';

		// start and end for extended block
		var startEx = '('+ pattern +')'+ // do not use "(...)" inside of pattern, use "(?:...)" instead
					  '('+ alignRe + classStyleLangAlignRe + ')'+
					  '\\.\\.'+
					  '(?::(\\S+))? (?=.+)';

		// if this is "extended" block which contains inner tokens inside
		// (e.g. <blockquote> contains <p> inside)
		var endEx = extra.innerToken ?
					   // then close it only when start of next block found
					  '\\s*(\n\n)'+
					  '(?='+
						'((bq)|(bc)|(notextile)|(pre)|(h([1-6]))|(fn(\\d+))|(p))'+
						'('+ alignRe + classStyleLangAlignRe +')'+
						'\\.(\\.?)(?::(\\S+))? '+
					  ')'
				  // else
				  :   // close it when two newlines found
					  '\\s*(\n)(?=\n)';

		// definition for usual block
		var syntaxDef = {
			start: start,
			end: end,
			restoreEnd: [1],
			mode: 'block',
			onMatchStart: function(match, syntax){
				this.args = this.args || {};
				var args = this.args;

				// get attributes of this block
				args.attrs = parseBlockAttributes(match[2], match[1]);

				// merge args.attrs with this.args.attrs
				for(var attrName in this.args.attrs)
					args.attrs[attrName] = this.args.attrs[attrName];

				// remember information about this block
				syntax.blocks.push( { token: this.token,
									  innerToken: this.innerToken,
									  args: args,
									  preProcess: this.preProcess,
									  match: match,
									  extended: this.extended } );
			},
			create: function(value, startMatch, endMatch, syntax){
				var block;

				// FIXME: This is a temporary workaround
				// It is all because create() is being called twice (see line #228 in Parser.js)
				// This check will be removed when bug in Parser.js fixed
				if(value)
					// get attributes of this block
					block = syntax.blocks.shift();
				else
					block = syntax.blocks[0];

				// this will be used by "anonymousBlock"
				syntax.prevBlock = block;

				// store value inside a block, so it can be used/changed in preProcess() callback
				block.value = value;

				// call the callback
				if(block.preProcess){
					block.preProcess.call(block);
				}

				return new block.token( block.value, block.args );
			}
		}
		// mix with extra
		dojo.mixin(syntaxDef, extra);


		// definition of "extended" block
		//
		// should be
		// var syntaxDefEx = dojo.clone(syntaxDef)
		// but it fails for some reason
		var syntaxDefEx = {};
		// mix with syntaxDef
		dojo.mixin(syntaxDefEx, syntaxDef);
		syntaxDefEx.start = startEx;
		syntaxDefEx.end = endEx;
		syntaxDefEx.extended = true;

		// return an array of two definitions
		return [syntaxDef, syntaxDefEx];
	}

	var spanDef = function(pattern, extra){
		if(!extra)
			extra = {};

		var punct = '.,"\'?!;:'

		/* ==
		regex ported from original Textile implementation
		var start = '(?:^|(?<=[\\s>'+ punct +'])|([{\\[]))'+
					'('+ pattern +')(?!'+ pattern +')'+
					'('+ classStyleLangAlignRe +')'+
					'(?::(\\S+))?'+
					'([^\\s'+ pattern +']+|\\S[^'+ pattern +'\n]*[^\\s'+ pattern +'\n])'+
					'(['+ punct +']*)'+
					 pattern +
					'(?:$|([\\]}])|(?=[-!"#$%&\'()*+,./:;<=>?@[\\\\\\]_`{|}~]{1,2}|\\s))';
		== */

		var start = pattern +'(?!'+ pattern +')'+
					'('+ classStyleLangAlignRe +')'+
					'(?::(\\S+))?'+
					'(?='+
					  '([^\\s'+ pattern +']+|\\S[^'+ pattern +'\n]*[^\\s'+ pattern +'\n])'+
					  '(['+ punct +']*)'+
					   pattern +
					  '(?:$|([\\]}])|(?=[-!"#$%&\'()*+,./:;<=>?@[\\\\\\]_`{|}~]{1,2}|\\s))'+
					')';

		var end = pattern +'(?=(?:$|([\\]}])|(?=[-!"#$%&\'()*+,./:;<=>?@[\\\\\\]_`{|}~]{1,2}|\\s)))';

		var syntaxDef = {
			start: start,
			end: end,
			mode: 'span',
			allowedChildren: ['span', 'text'],
			create: function(value, startMatch, endMatch, syntax){
				var attrs = parseBlockAttributes(startMatch[1]);
				return new this.token(value, { attrs: attrs });
			}
		}

		dojo.mixin(syntaxDef, extra);

		return syntaxDef;
	}

	// Helper functions
	var flatten = function(lst){
	   for(var i = 0; i < lst.length; i++){
		   var x = lst[i];
		   if(dojo.isArray(x)){
			   lst.splice.apply(lst, [i, 1].concat(x));
		   }
	   }
	   return lst;
	}

	// This function was ported from original Textile implementation
	var parseBlockAttributes = function(attrs, elem){
		if(!attrs)
			return {};

		var style = '';
		var class = '';
		var lang = '';
		var colspan = '';
		var rowspan = '';
		var id = '';
		var match = [];

		// colspan/rowspan
		if(elem == 'td'){
			if(match = /\\(\d+)/.exec(attrs))
				colspan = match[1];
			if(match = /\/(\d+)/.exec(attrs))
				rowspan = match[1];
		}

		// vertical align
		if(elem == 'td' || elem == 'tr'){
			if(match = /[\-^~]/.exec(attrs)){
				var vAlign = { '-': 'middle', '^': 'top', '~': 'bottom' };
				style += 'vertical-align:'+ vAlign[ match[0] ] +';';
			}
		}

		// style
		if(match = /\{([^\}]*)\}/.exec(attrs)){
			style += match[1] +';';
			attrs = attrs.replace(match[0], '');
		}

		// lang
		if(match = /\[([^\]]+)\]/.exec(attrs)){
			lang = match[1];
			attrs = attrs.replace(match[0], '');
		}

		// class & id
		if(match = /\(([^()]+)\)/.exec(attrs)){
			var match2;
			if(match2 = /^(.*)#(.*)$/.exec(match[1])){
				class = match2[1];
				id = match2[2];
			}else{
				class = match[1];
			}
			attrs = attrs.replace(match[0], '');
		}

		// padding-left
		if(match = /([(]+)/.exec(attrs)){
			style += 'padding-left:'+ match[1].length +'em;';
			attrs = attrs.replace(match[0], '');
		}

		// padding-right
		if(match = /([)]+)/.exec(attrs)){
			style += 'padding-right:'+ match[1].length +'em;';
			attrs = attrs.replace(match[0], '');
		}

		// text-align
		if(match = /(?:<(?!>)|>|<>|=|[()]+(?! ))/.exec(attrs)){
			var hAlign = { '<': 'left', '=': 'center', '>': 'right', '<>': 'justify' };
			style += 'text-align:'+ hAlign[ match[0] ] +';';
		}

		return { style: style,
				 "class": class,
				 lang: lang,
				 colspan: colspan,
				 rowspan: rowspan,
				 id: id };
	}

	// This function was ported from original Textile implementation
	var glyphs = function(text){
		if(!text)
			return '';

		var glyphSearch = [
			/(\w)'(\w)/,                                            // apostrophe's
			/(\s)'(\d+\w?)\b(?!\')/,                                // back in '88
			/(\S)'(?=\s|[-!"#$%&'()*+,.\/:;<=>?@[\\\]_`{|}~]|<|$)/, //  single closing
			/'/,                                                    //  single opening
			/(\S)"(?=\s|[-!"#$%&'()*+,.\/:;<=>?@[\\\]_`{|}~]|<|$)/, //  double closing
			/"/,                                                    //  double opening
			/\b([A-Z][A-Z0-9]{2,})\b(?:[\(]([^\)]*)[\)])/,          //  3+ uppercase acronym
			/\b([A-Z][A-Z'\-]+[A-Z])(?=[\s.,\)>])/,                 //  3+ uppercase
			/\b( )?\.{3}/,                                          //  ellipsis
			/(\s?)--(\s?)/,                                         //  em dash
			/\s-(?:\s|$)/,                                          //  en dash
			/(\d+)( ?)x( ?)(?=\d+)/,                                //  dimension sign
			/\b ?[\(\[]TM[\]\)]/i,                                  //  trademark
			/\b ?[\(\[]R[\]\)]/i,                                   //  registered
			/\b ?[\(\[]C[\]\)]/i,                                   //  copyright
			/\b\[([0-9]+)\](\s)?/                                   //  footnote
		];

		var glyphReplace = [
			'$1&#8217;$2',                       // apostrophe's
			'$1&#8217;$2',                       // back in '88
			'$1&#8217;',                         //  single closing
			'&#8216;',                           //  single opening
			'$1&#8221;',                         //  double closing
			'&#8220;',                           //  double opening
			'<acronym title="$2">$1</acronym>',  //  3+ uppercase acronym
			'<span class="caps">$1</span>',      //  3+ uppercase
			'$1&#8230;',                         //  ellipsis
			'$1&#8212;$2',                       //  em dash
			' &#8211; ',                         //  en dash
			'$1$2&#215;$3',                      //  dimension sign
			'&#8482;',                           //  trademark
			'&#174;',                            //  registered
			'&#169;',                            //  copyright
			'<sup class="footnote"><a href="#fn$1">$1</a></sup>$2' //  footnote
		];

		var out = '';
		var splitted = text.split(/(<.*?>)/);

		for(var i = 0; i < splitted.length; i++){
			if(splitted[i][0] != '<'){
				for(var j = 0; j < glyphSearch.length; j++)
					splitted[i] = splitted[i].replace(glyphSearch[j], glyphReplace[j]);
			}
			out += splitted[i];
		}

		return out;
	}


	dojo.declare("dools.markup.language.Textile", null,
	{
		// callback
		preProcess: function(text){
			// clear internal variables
			this.blocks = []; // information about all blocks is stored here
			this.prevBlock = {};
			this.listLevel = 0;

			// use lite version?
			if(dools.markup.language.Textile.lite)
				// TODO: implement lite version
				//
				// the following elements are not allowed in Textile lite
				//   notextile, code, lists, tables
				// and
				//   blockLite used instead of block
				this.allowedChildren = [];
			else
				this.allowedChildren = ['block', 'blockTag', 'anonymousBlock', 'table', 'list', 'text'];
		},

		tokens: flatten([

			// block-level html tag
			{ start: ' *<(p|blockquote|div|form|table|ul|ol|pre|h[1-6])[^>]*?>(?=(.|\n(?!\n))*</\\1>\n\n)',
			  end: '\\s*(\n)(?=\n)',
			  mode: 'blockTag',
			  allowedChildren: ['list', 'table', 'span', 'codeInline', 'text'],
			  create: function(value, startMatch, endMatch, syntax){
				  return new dools.markup.TextToken( startMatch[0] + glyphs(value) );
			  }
			},

			// blockquote
			blockDef('bq', {
				allowedChildren: ['anonymousBlockEx', 'list', 'table', 'span', 'codeInline', 'lineBreak', 'text'],
				preProcess: function(){
					this.args.attrs.cite = this.match[3];
					this.value = glyphs(this.value);
				},
				token: dools.markup.BlockquoteToken,
				innerToken: dools.markup.ParagraphToken
			}),

			// block code
			blockDef('bc', {
				allowedChildren: ['anonymousBlockEx', 'text'],
				token: dools.markup.PreToken,
				innerToken: dools.markup.CodeToken
			}),

			// notextile
			blockDef('notextile', {
				allowedChildren: ['codeText', 'text'],
				token: dools.markup.TextToken
			}),

			// pre
			blockDef('pre', {
				allowedChildren: ['codeText', 'text'],
				args: { encodeCode: true },
				token: dools.markup.PreToken
			}),

			// header
			blockDef('h[1-6]', {
				allowedChildren: ['span', 'codeInline', 'text'],
				token: dools.markup.HeaderToken,
				preProcess: function(){
					this.args.tagName = this.match[1];
					this.value = glyphs(this.value);
				}
			}),

			// footnote
			blockDef('fn\\d+', {
				allowedChildren: ['span', 'codeInline', 'lineBreak', 'text'],
				token: dools.markup.ParagraphToken,
				preProcess: function(){
					this.args.attrs["class"] = "footnote";
					this.args.attrs.id = this.match[1];
					var number = /fn(\d+)/.exec(this.match[1])[1];
					this.value = "<sup>"+ number +"</sup> "+ this.value;
					this.value = glyphs(this.value);
				}
			}),

			// paragraph
			blockDef('p', {
				allowedChildren: ['table', 'list', 'span', 'codeInline', 'lineBreak', 'text'],
				preProcess: function(){
					this.value = glyphs(this.value);
				},
				token: dools.markup.ParagraphToken
			}),


			// anonymous block inside of "extended" block
			{ start: ' *(\\S)', end: '\\s*(\n)(?=\n)',
			  mode: 'anonymousBlockEx',
			  restoreStart: [1],
			  restoreEnd: [1],
			  allowedChildren: ['table', 'list', 'span', 'codeInline', 'lineBreak', 'text'],
			  create: function(value, startMatch, endMatch, syntax){
				  // information about current parent block for this token is always in syntax.blocks[0]
				  // all anonymous blocks inside of "extended" block should derive all attributes of a parent
				  var block = syntax.blocks[0];

				  block.value = value;
				  // call the callback
				  if(block.preProcess){
					  block.preProcess.call(block);
				  }

				  // do what "extended" block says
				  return new block.innerToken( block.value, block.args );
			  }
			},

			// line break
			{ start: '\n',
			  mode: 'lineBreak',
			  token: dools.markup.LineBreakToken
			},

			// table
			{ start: '(?:table'+
					   '(_?'+ colspanRowspanRe + alignRe + classStyleLangAlignRe +')'+
					   '\\. ?\n'+
					 ')?'+ // end of optional table header
					 '('+ alignRe + classStyleLangAlignRe +'\\.? ?\\|(?:.*\\|\n)+\n)',
			  end: '\\s*(\n)(?=\n)',
			  mode: 'table',
			  restoreStart: [2],
			  restoreEnd: [1],
			  allowedChildren: ['tableRow', 'text'],
			  create: function(value, startMatch, endMatch, syntax){
				  var args = {};
				  args.attrs = parseBlockAttributes(startMatch[1], 'table');
				  return new dools.markup.TableToken(value, args);
			  }
			},

			// table row
			{ start: '('+ alignRe + classStyleLangAlignRe +'\\. )?\\|',
			  end: '\n',
			  mode: 'tableRow',
			  restoreEnd: [0],
			  allowedChildren: ['tableCell'],
			  create: function(value, startMatch, endMatch, syntax){
				  var args = {};
				  args.attrs = parseBlockAttributes(startMatch[1], 'tr');

				  return new dools.markup.TableRowToken(value, args);
			  }
			},

			// table cell
			{ start: '((_)?'+ colspanRowspanRe + alignRe + classStyleLangAlignRe +'\\. )?([^|])',
			  end: '\\|',
			  mode: 'tableCell',
			  restoreStart: [3],
			  allowedChildren: ['span', 'codeInline', 'text'],
			  create: function(value, startMatch, endMatch, syntax){
				  var args = {};
				  args.attrs = parseBlockAttributes(startMatch[1], 'td');
				  value = glyphs(value);

				  return startMatch[2] ? new dools.markup.TableHeaderToken(value, args) :
										 new dools.markup.TableDataToken(value, args);
			  }
			},

			// list
			{ start: '\n(([#*])[#*]{0,0})('+ classStyleLangAlignRe +') ',
			  end: '', // will be defined in onMatchStart()
			  mode: 'list',
			  allowedChildren: ['list', 'span', 'codeInline', 'text'],
			  restoreEnd: [1],
			  onMatchStart: function(match, syntax){
				  syntax.listLevel++;
				  this.start = '\n(([#*])[#*]{0,'+ syntax.listLevel +'})('+ classStyleLangAlignRe +') ';
				  this.end = '(\n)(?=([#*]{0,'+ syntax.listLevel +'}[^#*])|[^#*])';
			  },
			  onMatchEnd: function(match, syntax){
				  syntax.listLevel--;
				  this.start = '\n(([#*])[#*]{0,'+ syntax.listLevel +'})('+ classStyleLangAlignRe +') ';
				  this.end = '(\n)(?=([#*]{0,'+ syntax.listLevel +'}[^#*])|[^#*])';
			  },
			  create: function(value, startMatch, endMatch, syntax){
				  var args = {};
				  args.groupAttrs = parseBlockAttributes(startMatch[3], 'li');
				  args.ordered = (startMatch[2] == '#') ? true : false;
				  value = glyphs(value);

				  return new dools.markup.ListItemToken(value, args);
			  }
			},


			// anonymous block
			{ start: ' *(\\S)', end: '\\s*(\n)(?=\n)',
			  mode: 'anonymousBlock',
			  restoreStart: [1],
			  restoreEnd: [1],
			  allowedChildren: ['table', 'list', 'span', 'codeInline', 'lineBreak', 'text'],
			  create: function(value, startMatch, endMatch, syntax){
				  var block = syntax.prevBlock;

				  // if we are inside of "extended" block
				  if(block.extended){
					  block.value = value;
					  // call the callback
					  if(block.preProcess){
						  block.preProcess.call(block);
					  }
					  // and do what "extended" block says
					  return new block.token( block.value, block.args );
				  }
				  // else just create paragraph
				  return new dools.markup.ParagraphToken( glyphs(value) );
			  }
			},


			// italic
			spanDef('__', {
				token: dools.markup.ItalicToken
			}),
			// emphasis
			spanDef('_', {
				token: dools.markup.EmphasisToken
			}),
			// bold
			spanDef('\\*\\*', {
				token: dools.markup.BoldToken
			}),
			// strong
			spanDef('\\*', {
				token: dools.markup.StrongToken
			}),
			// citation
			spanDef('\\?\\?', {
				token: dools.markup.CitationToken
			}),
			// deleted
			spanDef('-', {
				token: dools.markup.DeletedToken
			}),
			// inserted
			spanDef('\\+', {
				token: dools.markup.InsertedToken
			}),
			// superscript
			spanDef('\\^', {
				token: dools.markup.SuperscriptToken
			}),
			// subscript
			spanDef('~', {
				token: dools.markup.SubscriptToken
			}),
			// span
			spanDef('%', {
				token: dools.markup.SpanToken
			}),

			// inline code
			{ start: '(^|\\s|[\\[({>])@(?=(.|\n(?!\n))*?@)',
			  end: '@',
			  mode: 'codeInline',
			  allowedChildren: ['codeText', 'text'],
			  token: dools.markup.CodeToken
			},
			{ start: '(^|\\s|[\\[({>])<code>(?=(.|\n(?!\n))*?</code>)',
			  end: '</code>',
			  mode: 'codeInline',
			  allowedChildren: ['codeText', 'text'],
			  token: dools.markup.CodeToken
			},

			// notextile
			{ start: '(^|\\s|[\\[({>])<notextile>(?=(.|\n(?!\n))*?</notextile>)',
			  end: '</notextile>',
			  mode: 'codeInline',
			  allowedChildren: ['codeText', 'text'],
			  token: dools.markup.TextToken
			},
			{ start: '(^|\\s|[\\[({>])==(?=(.|\n(?!\n))*?==)',
			  end: '==',
			  mode: 'codeInline',
			  allowedChildren: ['codeText', 'text'],
			  token: dools.markup.TextToken
			},


			// link
			{ start: '"'+
					 '('+ classStyleLangAlignRe +')'+ // attrs
					 '(?='+
					   '([^"]+)\\s?'+ // link text
					   '(?:\\(([^)]+)\\)(?="))?'+ // title
					   '":'+
					   '('+ urlchRe +'+)'+ // url
					   '(\\/)?'+ // slash
					   '[^\\w\\/;]*(?:([\\]}])|(?:\\s|$|\\)))'+
					 ')',
			  end: '(?:\\(([^)]+)\\)(?="))?'+ // title
				   '":'+
				   '('+ urlchRe +'+)'+ // url
				   '(\\/)?'+ // slash
				   '(?=[^\\w\\/;]*(?:([\\]}])|(?:\\s|$|\\))))',
			  mode: 'span',
			  allowedChildren: ['span', 'text'],
			  create: function(value, startMatch, endMatch, syntax){
				  var args = {};
				  args.attrs = parseBlockAttributes(startMatch[1]);
				  args.attrs.title = endMatch[1];
				  args.attrs.href  = endMatch[2];
				  return new dools.markup.LinkToken(value, args);
			  }
			},

			// image
			{ start: '!'+                    // opening !
					 '(\\<|=|\\>)??'+        // optional alignment attrs
					 '('+ classStyleLangAlignRe +')'+ // optional style, class .. attrs
					 '(?:\\. )?'+            // optional dot space
					 '([^\\s(!]+)'+          // presume this is the src
					 '\\s?'+                 // optional space
					 '(?:\\(([^\\)]+)\\))?'+ // optional title
					 '\\!'+                  // closing !
					 '(?::(\\S+))?'+         // optional href
					 '(?=[\\]}]|(?:\\s|$))', // space or end of string
			  mode: 'span',
			  create: function(value, startMatch, endMatch, syntax){
				  var args = {};
				  var align = { '<': 'left', '=': 'center', '>': 'right' };

				  args.attrs = parseBlockAttributes(startMatch[2]);
				  args.attrs.align = align[ startMatch[1] ];
				  args.attrs.src   = startMatch[3];
				  args.attrs.title = startMatch[4];
				  args.attrs.alt   = startMatch[4];

				  var token = new dools.markup.ImageToken(value, args);

				  // if this is an image inside of link
				  if(startMatch[5])
					  token = new dools.markup.LinkToken(token.toHtml(), {attrs: {href: startMatch[5]}});
				  return token;
			  }
			},


			// code text
			{ start: '[@<=]?[^@<=\n]*',
			  mode: 'codeText',
			  token: dools.markup.TextToken
			},

			// text
			{ start: '\n',
			  mode: 'text',
			  token: dools.markup.TextToken
			},

			// match one special character and anything else after it until next
			// special character or newline found
			{ start: '[_\\*\\?\\-\\+\\^~%"@<=(!|]?[^_\\*\\?\\-\\+\\^~%"@<=(!|\n]*',
			  mode: 'text',
			  token: dools.markup.TextToken
			},

			{ start: ' ',
			  mode: 'text',
			  token: dools.markup.TextToken
			}
		]),

		postProcess: function(tokensStack){
		}
	});


})();

// vim:ts=4:et:tw=0:
