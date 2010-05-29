dojo.provide("dools.markup.language.Markdown");

dojo.declare("dools.markup.language.Markdown", null,
{

	preProcess: function(text){
		// TODO: is it ok to write like this?

		// clear storage for reference-style links and images
		dools.markup.language.Markdown.referenceLinks = [];
		dools.markup.language.Markdown.referenceImages = [];

		// variables used in list processing
		dools.markup.language.Markdown.listLevel = 0;
		dools.markup.language.Markdown.listSpaces = [0];

		// variables used in html tags processing
		dools.markup.language.Markdown.tagLevel = 0;
		dools.markup.language.Markdown.tagName = [];
	},

	// block-level elements here
	allowedChildren: ['listItem', 'paragraph', 'codeLine', 'blockquoteLine', 'atxHeader',
					  'settextHeader', 'referenceLinkDef', 'horizontalRule', 'htmlBlockTag',
					  'escapedChar', 'text'],

	tokens: [
		// backslash escapes
		{ start: '\\\\((\\\\)|[`*_{}\\[\\]()>#+-.!])',
		  mode: 'escapedChar',
		  create: function(value, startMatch, endMatch){
			  return new dools.markup.TextToken(startMatch[1]);
		  }
		},



		// lists
		//
		// list item ends if:
		//      start of next list item found
		//   or start of paragraph that doesn't belong to this list item found
		//   or end of input stream found
		{ start: '([ ]{0,4})([*+-]|\\d+[.])(?=[ ]+\\S)', end: '\n(?=([ ]{0,4}([*+-]|\\d+[.]) )|(\n[ ]{0,0}\\S)|\\s*$)',
		  mode: 'listItem',
		  restoreEnd: [0],
		  allowedChildren: ['listItem', 'listItemParagraph', 'codeLine', 'blockquoteLine', 'text'],

		  // helper functions
		  tuneStart: function(minSpace, maxSpace){
			  this.start = '([ ]{'+ minSpace +','+ maxSpace +'})([*+-]|\\d+[.])(?=[ ]+\\S)';
		  },
		  tuneEnd: function(minSpace, maxSpace){
			  this.end = '\n(?=([ ]{'+ minSpace +','+ maxSpace +'}([*+-]|\\d+[.]) )|(\n[ ]{0,'+ maxSpace +'}\\S)|\\s*$)';
		  },

		  // callbacks
		  onMatchStart: function(match){
			  var space = match[1].length;
			  this.tuneStart(space+1, space+4);
			  this.tuneEnd(0, space);
			  dools.markup.language.Markdown.listSpaces[ ++dools.markup.language.Markdown.listLevel ] = space;
		  },
		  onMatchEnd: function(match){
			  var space = dools.markup.language.Markdown.listSpaces[ --dools.markup.language.Markdown.listLevel ];
			  this.tuneStart(0, space+4);
			  this.tuneEnd(0, space);
		  },
		  create: function(value, startMatch, endMatch){
			  return new dools.markup.ListItemToken(value, {ordered: (startMatch[2].search(/[*+-]/g)>-1) ? false : true});
		  }
		},
		{ start: '\n(?=[ ]*([*+-]|\\d+[.])[ ]+\\S)',
		  discard: true
		},

		// listItemParagraph ends if:
		//      start of next paragraph found
		//   or start of blockquote found
		//   or start of next list item found
		{ start: '[ ]+(?=\\S)', end: '\\s*(\n)(?=(\n([ ]*))|([ ]*([*+-]|\\d+[.]) ))',
		  mode: 'listItemParagraph',
		  restoreEnd: [1],
		  allowedChildren: ['text'],
		  onMatchStart: function(match){
			  var space = dools.markup.language.Markdown.listSpaces[ dools.markup.language.Markdown.listLevel ];
			  this.start = '[ ]{'+ (space+1) +','+ (space+7) +'}(?=\\S)';
		  },
		  onMatchEnd: function(match){
			  var space = dools.markup.language.Markdown.listSpaces[ dools.markup.language.Markdown.listLevel ];

			  // if
			  //     start of next list item found
			  //  or end of whole list found
			  if(match[4] || !match[3]){
				  // restore this.start
				  this.start = '[ ]+(?=\\S)';
				  return;
			  }
			  // if start of paragraph, which doesn't belong to this
			  // list item, found
			  else if(match[3] && (match[3].length <= space))
				  space = dools.markup.language.Markdown.listSpaces[ dools.markup.language.Markdown.listLevel-1 ];
			  this.start = '[ ]{'+ (space+1) +','+ (space+7) +'}(?=\\S)';
		  },
		  token: dools.markup.ParagraphToken
		},

		// code blocks
		{ start: '    ', end: '\n',
		  mode: 'codeLine',
		  restoreEnd: [0],
		  allowedChildren: ['codeText'],
		  token: dools.markup.PreCodeToken
		},
		{ start: '\n(?=    )',
		  mode: 'codeLine',
		  token: dools.markup.PreCodeToken
		},

		// atx headers
		{ start: '(#{1,6}) *', end: ' *#*(\n)',
		  mode: 'atxHeader',
		  restoreEnd: [1],
		  // TODO: add referenceImage, html
		  allowedChildren: ['bold', 'italic', 'link', 'referenceLink', 'image', 'code', 'escapedChar', 'text'],
		  create: function(value, startMatch, endMatch){
			  return new dools.markup.HeaderToken(value, {level: startMatch[1].length});
		  }
		},
		// settext headers
		{ start: '\n *(?=.+\n[=-]+ *\n)', end: ' *\n([=-])+ *',
		  mode: 'settextHeader',
		  // TODO: add referenceImage, html
		  allowedChildren: ['bold', 'italic', 'link', 'referenceLink', 'image', 'code', 'escapedChar', 'text'],
		  create: function(value, startMatch, endMatch){
			  var level = (endMatch[1] == '=') ? 1 : 2;
			  return new dools.markup.HeaderToken(value, {level: level});
		  }
		},

		// blockquotes
		{ start: '> ?', end: '\n(?=( *.+\n[=-]+ *\n)|([\n#]|( *>)))',
		  mode: 'blockquoteLine',
		  restoreEnd: [0],
		  args: {grouped: true},
		  allowedChildren: ['blockquoteLine', 'blockquoteCutter', 'text'],
		  token: dools.markup.BlockquoteToken
		},
		{ start: '\\s*\n *(?=>)',
		  mode: 'blockquoteLine',
		  args: {grouped: true},
		  token: dools.markup.BlockquoteToken
		},

		// inline image (regex copied from Showdown)
		{ start: '(!\\[(.*?)\\]\\s?\\( *()<?(\\S+?)>? *(([\'"])(.*?)\\6 *)?\\))',
		  mode: 'image',
		  create: function(value, startMatch, endMatch){
			  return new dools.markup.ImageToken(value, {attrs: {alt: startMatch[2], src: startMatch[4], title: startMatch[7]}});
		  }
		},


		// reference-style link definition (regex copied from Showdown)
		{ start: '[ ]{0,3}\\[(.+)\\]: *\n? *<?(\\S+?)>? *\n? *(?:(\n*)["(](.+?)[")] *)?(\n)',
		  mode: 'referenceLinkDef',
		  create: function(value, startMatch, endMatch){
			  var linkId = startMatch[1].toLowerCase();
			  return new dools.markup.ReferenceLinkToken('', {linkId: linkId,
															  attrsStorage: dools.markup.language.Markdown.referenceLinks,
															  attrs: {href: startMatch[2], title: startMatch[4]}
															  });
		  }
		},

		// reference-style link
		{ start: '\\[([^\\[\\]\n]+)\\][ ]?(?:\n[ ]*)?\\[(.*?)\\]',
		  mode: 'referenceLink',
		  create: function(value, startMatch, endMatch){
			  var linkId = (startMatch[2]) ? startMatch[2].toLowerCase() : startMatch[1].toLowerCase();
			  return new dools.markup.ReferenceLinkToken(startMatch[0], {linkId: linkId,
																		 innerHtml: startMatch[1],
																		 attrsStorage: dools.markup.language.Markdown.referenceLinks});
		  }
		},

		// inline link (regex copied from Showdown)
		{ start: '(\\[((?:\\[[^\\]]*\\]|[^\\[\\]])*)\\]\\( *()<?(.*?)>? *(([\'"])(.*?)\\6 *)?\\))',
		  mode: 'link',
		  create: function(value, startMatch, endMatch){
			  return new dools.markup.LinkToken(startMatch[2], {attrs: {href: startMatch[4], title: startMatch[7]}});
		  }
		},

		// reference-style shortcuts (regex copied from Showdown)
		{ start: '\\[([^\\[\\]\n]+)\\]',
		  mode: 'referenceLink',
		  create: function(value, startMatch, endMatch){
			  var linkId = startMatch[1].toLowerCase();
			  return new dools.markup.ReferenceLinkToken(startMatch[0], {linkId: linkId,
																		 innerHtml: startMatch[1],
																		 attrsStorage: dools.markup.language.Markdown.referenceLinks});
		  }
		},

		// autolinks
		{ start: '((<((https?|ftp|dict):[^\'">\\s]+)>)|(<(mailto:)?([-.\\w]+\\@[-a-z0-9]+(\\.[-a-z0-9]+)*\\.[a-z]+)>))',
		  mode: 'link',
		  create: function(value, startMatch, endMatch){
			  var value  = startMatch[7] || startMatch[3];
			  var href   = (startMatch[7] ? (startMatch[6] || "mailto:")+startMatch[7] : null) || startMatch[3];
			  var encode = startMatch[7] ? true : false;
			  return new dools.markup.LinkToken(value, {attrs: {href: href}, encode: encode});
		  }
		},

		// horizontal rules (regexps copied from Showdown)
		{ start: '[ ]{0,2}([ ]?\\*[ ]?){3,} *(\n)',
		  restoreStart: [2],
		  mode: 'horizontalRule',
		  token: dools.markup.HorizontalRuleToken
		},
		{ start: '[ ]{0,2}([ ]?-[ ]?){3,} *(\n)',
		  restoreStart: [2],
		  mode: 'horizontalRule',
		  token: dools.markup.HorizontalRuleToken
		},
		{ start: '[ ]{0,2}([ ]?_[ ]?){3,} *(\n)',
		  restoreStart: [2],
		  mode: 'horizontalRule',
		  token: dools.markup.HorizontalRuleToken
		},


		// TODO: bold and italic handling is ugly, however
		//       I didn't end up with a better solution for now
		//
		// old:
		//{ start: '\\*\\*(?!\\s+)', end: '\\*\\*',
		//
		// requires at least three chars inside:
		//{ start: '\\*\\*(?=(\\S).+?\\**(\\S)\\*\\*)', end: '\\*\\*',
		//
		// with restoreStart produces wrong output when no text inside:
		//{ start: '\\*\\*(?=\\S)(.*?\\S[*_]*\\*\\*)', end: '\\*\\*',
		{ start: '\\*\\*(?=\\S)(.*?\\S[*_]*\\*\\*)', end: '\\*\\*(?!\\*)',
		  mode: 'bold',
		  restoreStart: [1],
		  // TODO: add referenceImage, html
		  allowedChildren: ['italic', 'link', 'referenceLink', 'image', 'code', 'escapedChar', 'text'],
		  token: dools.markup.StrongToken
		},
		{ start: '__(?=\\S)(.*?\\S[*_]*__)', end: '__(?!_)',
		  mode: 'bold',
		  restoreStart: [1],
		  // TODO: add referenceImage, html
		  allowedChildren: ['italic', 'link', 'referenceLink', 'image', 'code', 'escapedChar', 'text'],
		  token: dools.markup.StrongToken
		},
		// old:
		//{ start: '\\*(?!\\s+)', end: '\\*',
		//
		// with restoreStart produces wrong output when no text inside:
		//{ start: '\\*(?=\\S)(.*?\\S\\*)', end: '\\*',
		//
		// requires at least one char inside
		//{ start: '\\*(?=\\S.*?\\S\\*)', end: '\\*',
		{ start: '\\*(?=\\S.*?\\S\\*)', end: '\\*',
		  mode: 'italic',
		  // TODO: add referenceImage, html
		  allowedChildren: ['bold', 'link', 'referenceLink', 'image', 'code', 'escapedChar', 'text'],
		  token: dools.markup.EmphasisToken
		},
		{ start: '_(?=\\S.*?\\S_)', end: '_',
		  mode: 'italic',
		  // TODO: add referenceImage, html
		  allowedChildren: ['bold', 'link', 'referenceLink', 'image', 'code', 'escapedChar', 'text'],
		  token: dools.markup.EmphasisToken
		},
		// special case to match italic with one char inside ( *i* )
		{ start: '(\\*|_)(\\S)\\1',
		  mode: 'italic',
		  create: function(value, startMatch, endMatch){
			  return new dools.markup.EmphasisToken(startMatch[2]);
		  }
		},

		// inline code
		{ start: '(`+)(.+?[^`])\\1(?!`)',
		  mode: 'code',
		  create: function(value, startMatch, endMatch){
			  startMatch[2] = startMatch[2].replace(/^([ \t]*)/g,""); // leading whitespace
			  startMatch[2] = startMatch[2].replace(/[ \t]*$/g,"");   // trailing whitespace
			  return new dools.markup.CodeToken(startMatch[2]);
		  }
		},

		// code
		{ start: '.+',
		  mode: 'codeText',
		  token: dools.markup.TextToken
		},

		// block html
		/*
		{ start: '\\s*<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)'+
				 '(?:\\s+[\\w.:_-]+\\s*=\\s*(["\']).+?\\2)*\\s*>[\\S\\s]*<\\/\\1>',
		  mode: 'htmlBlockTag',
		  token: dools.markup.TextToken
		},
		*/
		// block html
		/*{ start: '<(p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|script|noscript|form|fieldset|iframe|math|ins|del)'+
				 '(?:\\s+[\\w.:_-]+\\s*=\\s*(["\']).+?\\2)*\\s*>(?=[\\S\\s]*<\\/\\1>)',
		  end: '', // will be defined when start found

		  onMatchStart: function(match){
			  dools.markup.language.Markdown.tagName[ ++dools.markup.language.Markdown.tagLevel ] = match[1];
			  this.end = '<\\/'+ match[1] +'>';
		  },
		  onMatchEnd: function(match){
			  var tagName = dools.markup.language.Markdown.tagName[ --dools.markup.language.Markdown.tagLevel ];
			  this.end = '<\\/'+ tagName +'>';
		  },
		  mode: 'htmlBlockTag',
		  allowedChildren: ['htmlBlockTag', 'htmlText'],
		  create: function(value, startMatch, endMatch){
			  return new dools.markup.TextToken( startMatch[0] + value + endMatch[0] );
		  }
		},
		{ start: '[\\S\\s]+(?=<)',
		  mode: 'htmlText',
		  token: dools.markup.TextToken
		},*/


		// paragraphs
		//
		// paragraph ends if:
		//      start of next paragraph found
		//   or start of header found
		//   or start of blockquote found
		// ! or horizontal rule found
		// ! or block-level html tag found
		//{ start: '\\s*(?![\\s#>]|(.+\n[=-]+ *\n)|(([*+-]|\\d+[.])[ ]+\\S))(\\S)(?=[\\S\\s]+\n\n)',
		{ start: ' *(\\S)', end: '\\s*(\n)(?=([\n#]|(.+\n[=-]+ *\n)|( *>)))',
		  mode: 'paragraph',
		  restoreStart: [1],
		  restoreEnd: [1],
		  // TODO: add referenceImage, html
		  allowedChildren: ['bold', 'italic', 'link', 'referenceLink', 'image', 'code', 'escapedChar', 'text'],
		  token: dools.markup.ParagraphToken
		},


		// text
		{ start: '\n',
		  mode: 'text',
		  token: dools.markup.TextToken
		},

		// match one special character and anything else after it until next
		// special character or newline found
		{ start: '[*_`[<!#\\\\]?[^*_`[<!#\n\\\\]*',
		  mode: 'text',
		  token: dools.markup.TextToken
		},

		{ start: ' ',
		  mode: 'text',
		  token: dools.markup.TextToken
		}
	],

	postProcess: function(tokensStack){
	}
});
