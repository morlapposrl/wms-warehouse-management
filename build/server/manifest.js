const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.ENwCJJjx.js",app:"_app/immutable/entry/app.D4sTn_hB.js",imports:["_app/immutable/entry/start.ENwCJJjx.js","_app/immutable/chunks/r-gIXjNo.js","_app/immutable/chunks/CSKnirQD.js","_app/immutable/chunks/DGqEDapY.js","_app/immutable/entry/app.D4sTn_hB.js","_app/immutable/chunks/DGqEDapY.js","_app/immutable/chunks/CSKnirQD.js","_app/immutable/chunks/DsnmJJEf.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-CQQQgwZi.js')),
			__memo(() => import('./chunks/1-Dkt552IN.js')),
			__memo(() => import('./chunks/2-D_CcV01c.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
