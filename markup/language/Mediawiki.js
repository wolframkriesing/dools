dojo.provide("dools.markup.language.Mediawiki");

dojo.declare("dools.markup.language.Mediawiki", null,
{
	tokens: [
		{ start: "'''", end: "'''",
		  token: dools.markup.BoldToken
		},
		{ start: "''", end: "''",
		  token: dools.markup.ItalicToken
		},
		{ start: '\\[(\\S+)([^\\]]*)\\]',
		  create: function(value, startMatch, endMatch, syntax){
			  return new dools.markup.LinkToken(startMatch[2], {props: {href: startMatch[1]}});
		  }
		},
		{ start: '\n=([^=]+)=',
		  create: function(value, startMatch, endMatch, syntax){
			  return new dools.markup.HeaderToken(startMatch[1], { level: 1 });
		  }
		},
		{ start: '\n==([^=]+)==',
		  create: function(value, startMatch, endMatch, syntax){
			  return new dools.markup.HeaderToken(startMatch[1], { level: 2 });
		  }
		},
		{ start: '\n\\*(.*)',
		  create: function(value, startMatch, endMatch, syntax){
			  return new dools.markup.ListItemToken(startMatch[1], { ordered: false });
		  }
		},
		{ start: '\n#(.*)',
		  create: function(value, startMatch, endMatch, syntax){
			  return new dools.markup.ListItemToken(startMatch[1], { ordered: true });
		  }
		},
		{ start: '\n', // new lines are special!
		  token: dools.markup.TextToken
		},
		{ start: '[-A-Za-z0-9_\\. ]*',
		  token: dools.markup.TextToken
		}
	],
	postProcess: function(stream)
	{
	}
});
