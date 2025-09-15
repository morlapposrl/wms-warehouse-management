const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.ico","favicon.png","morlappo-logo-dark.png","morlappo-logo-white.png","morlappo-logo.png","sw.js"]),
	mimeTypes: {".png":"image/png",".js":"text/javascript"},
	_: {
		client: {start:"_app/immutable/entry/start.CW8x59Wy.js",app:"_app/immutable/entry/app.DwEFSfbW.js",imports:["_app/immutable/entry/start.CW8x59Wy.js","_app/immutable/chunks/CwcYZ3dd.js","_app/immutable/chunks/AlmnRKBw.js","_app/immutable/chunks/CFzDMuGy.js","_app/immutable/chunks/BQQhhvfh.js","_app/immutable/chunks/VxMGlj5l.js","_app/immutable/entry/app.DwEFSfbW.js","_app/immutable/chunks/CFzDMuGy.js","_app/immutable/chunks/BQQhhvfh.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/AlmnRKBw.js","_app/immutable/chunks/DAdvxR5M.js","_app/immutable/chunks/CgmHWflI.js","_app/immutable/chunks/Br1SzKNR.js","_app/immutable/chunks/VxMGlj5l.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-zI1Mcloq.js')),
			__memo(() => import('./chunks/1-Di4H35_F.js')),
			__memo(() => import('./chunks/2-BfNGAjFN.js')),
			__memo(() => import('./chunks/3-CTTePlpy.js')),
			__memo(() => import('./chunks/4-49JMroZK.js')),
			__memo(() => import('./chunks/5-qIeAFpU7.js')),
			__memo(() => import('./chunks/6-D36Hgx22.js')),
			__memo(() => import('./chunks/7-DEgnBjDq.js')),
			__memo(() => import('./chunks/8-DK44hw0i.js')),
			__memo(() => import('./chunks/9-BXaXzQZZ.js')),
			__memo(() => import('./chunks/10-BCabuozS.js')),
			__memo(() => import('./chunks/11-wjJaCthU.js')),
			__memo(() => import('./chunks/12-DH_h9Nr8.js')),
			__memo(() => import('./chunks/13-DUBduE0u.js')),
			__memo(() => import('./chunks/14-C5J0oFmV.js')),
			__memo(() => import('./chunks/15-CU9wGtwy.js')),
			__memo(() => import('./chunks/16-BRpt2EqR.js')),
			__memo(() => import('./chunks/17-CyhbHySn.js')),
			__memo(() => import('./chunks/18-DQMKclsO.js')),
			__memo(() => import('./chunks/19-B1c_unpH.js')),
			__memo(() => import('./chunks/20-DHNYkfJ3.js')),
			__memo(() => import('./chunks/21-DQxkJsBM.js')),
			__memo(() => import('./chunks/22-BG3X-awU.js')),
			__memo(() => import('./chunks/23-D6M6Wmjo.js')),
			__memo(() => import('./chunks/24-DoNt6-3I.js')),
			__memo(() => import('./chunks/25-ZdXB17TD.js')),
			__memo(() => import('./chunks/26-BBvobtQN.js')),
			__memo(() => import('./chunks/27-x0Ut5xNO.js')),
			__memo(() => import('./chunks/28-DDUAVaIg.js')),
			__memo(() => import('./chunks/29-CEHiRDAw.js')),
			__memo(() => import('./chunks/30--xeVEv_w.js')),
			__memo(() => import('./chunks/31-Dpnc6SZU.js')),
			__memo(() => import('./chunks/32-CBYcXIWv.js')),
			__memo(() => import('./chunks/33-DLSidmgO.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/admin/categorie/copy",
				pattern: /^\/api\/admin\/categorie\/copy\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CXLGc9GC.js'))
			},
			{
				id: "/api/admin/committenti",
				pattern: /^\/api\/admin\/committenti\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-VEzy_VAO.js'))
			},
			{
				id: "/api/admin/committenti/check",
				pattern: /^\/api\/admin\/committenti\/check\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BnisebeK.js'))
			},
			{
				id: "/api/admin/committenti/stats",
				pattern: /^\/api\/admin\/committenti\/stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dgr8IU0k.js'))
			},
			{
				id: "/api/admin/committenti/with-stats",
				pattern: /^\/api\/admin\/committenti\/with-stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BJcWJkVT.js'))
			},
			{
				id: "/api/admin/committenti/[id]",
				pattern: /^\/api\/admin\/committenti\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DQs90Ens.js'))
			},
			{
				id: "/api/admin/committenti/[id]/cascade-delete",
				pattern: /^\/api\/admin\/committenti\/([^/]+?)\/cascade-delete\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dfb-J5JT.js'))
			},
			{
				id: "/api/admin/fornitori",
				pattern: /^\/api\/admin\/fornitori\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BmAxodLx.js'))
			},
			{
				id: "/api/admin/fornitori/check",
				pattern: /^\/api\/admin\/fornitori\/check\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CDD3M0kA.js'))
			},
			{
				id: "/api/admin/fornitori/suggestions",
				pattern: /^\/api\/admin\/fornitori\/suggestions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BgSW9kLq.js'))
			},
			{
				id: "/api/admin/fornitori/[id]",
				pattern: /^\/api\/admin\/fornitori\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BnDC6OH3.js'))
			},
			{
				id: "/api/admin/prodotti/copy",
				pattern: /^\/api\/admin\/prodotti\/copy\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Cjc_3bZZ.js'))
			},
			{
				id: "/api/admin/unita-misura",
				pattern: /^\/api\/admin\/unita-misura\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DMpm-9NU.js'))
			},
			{
				id: "/api/admin/unita-misura/init",
				pattern: /^\/api\/admin\/unita-misura\/init\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-GhFIC-ql.js'))
			},
			{
				id: "/api/categorie",
				pattern: /^\/api\/categorie\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BzpJ26Xc.js'))
			},
			{
				id: "/api/categorie/global",
				pattern: /^\/api\/categorie\/global\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-D--nvSFT.js'))
			},
			{
				id: "/api/categorie/[id]",
				pattern: /^\/api\/categorie\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BI_rJqGI.js'))
			},
			{
				id: "/api/causali-trasferimento",
				pattern: /^\/api\/causali-trasferimento\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B-hj5PwY.js'))
			},
			{
				id: "/api/causali",
				pattern: /^\/api\/causali\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-D_jxDqvd.js'))
			},
			{
				id: "/api/causali/[id]",
				pattern: /^\/api\/causali\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CjRPN1Rf.js'))
			},
			{
				id: "/api/committenti",
				pattern: /^\/api\/committenti\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Bqb8Dq9z.js'))
			},
			{
				id: "/api/dashboard/alerts-live",
				pattern: /^\/api\/dashboard\/alerts-live\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B_afi5Nb.js'))
			},
			{
				id: "/api/dashboard/full-data",
				pattern: /^\/api\/dashboard\/full-data\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B3SPKgZ6.js'))
			},
			{
				id: "/api/dashboard/giacenze-live",
				pattern: /^\/api\/dashboard\/giacenze-live\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DGC_bbs6.js'))
			},
			{
				id: "/api/dashboard/kpi-live",
				pattern: /^\/api\/dashboard\/kpi-live\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dm6UHrNo.js'))
			},
			{
				id: "/api/dashboard/operatori-live",
				pattern: /^\/api\/dashboard\/operatori-live\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DtFFodoo.js'))
			},
			{
				id: "/api/fornitori",
				pattern: /^\/api\/fornitori\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DBbhKJ4O.js'))
			},
			{
				id: "/api/fornitori/global",
				pattern: /^\/api\/fornitori\/global\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DXPT5HL6.js'))
			},
			{
				id: "/api/fornitori/[id]",
				pattern: /^\/api\/fornitori\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-vTDpSTkH.js'))
			},
			{
				id: "/api/fornitori/[fornitore_id]/prodotti",
				pattern: /^\/api\/fornitori\/([^/]+?)\/prodotti\/?$/,
				params: [{"name":"fornitore_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DGJ5lhU8.js'))
			},
			{
				id: "/api/giacenze/global",
				pattern: /^\/api\/giacenze\/global\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D3OSdSlg.js'))
			},
			{
				id: "/api/giacenze/realtime",
				pattern: /^\/api\/giacenze\/realtime\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-QTbadJDE.js'))
			},
			{
				id: "/api/logs",
				pattern: /^\/api\/logs\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C-spGCqL.js'))
			},
			{
				id: "/api/magazzini",
				pattern: /^\/api\/magazzini\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-BWDRwb1f.js'))
			},
			{
				id: "/api/magazzini/[id]",
				pattern: /^\/api\/magazzini\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-C4owsQb9.js'))
			},
			{
				id: "/api/movimenti/global",
				pattern: /^\/api\/movimenti\/global\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DV_2f0qK.js'))
			},
			{
				id: "/api/ordini",
				pattern: /^\/api\/ordini\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BKi-kb7k.js'))
			},
			{
				id: "/api/prodotti",
				pattern: /^\/api\/prodotti\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DHd-5Lq4.js'))
			},
			{
				id: "/api/prodotti/global",
				pattern: /^\/api\/prodotti\/global\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-kvRrGWM6.js'))
			},
			{
				id: "/api/test-db",
				pattern: /^\/api\/test-db\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CkrZczGd.js'))
			},
			{
				id: "/api/tipi-udc",
				pattern: /^\/api\/tipi-udc\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CIXF2jPb.js'))
			},
			{
				id: "/api/tipi-udc/[id]",
				pattern: /^\/api\/tipi-udc\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DUL9XwJ2.js'))
			},
			{
				id: "/api/trasferimenti",
				pattern: /^\/api\/trasferimenti\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CzbzxsSO.js'))
			},
			{
				id: "/api/ubicazioni",
				pattern: /^\/api\/ubicazioni\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BQfqURvx.js'))
			},
			{
				id: "/api/ubicazioni/bulk",
				pattern: /^\/api\/ubicazioni\/bulk\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-1AjJuVv2.js'))
			},
			{
				id: "/api/ubicazioni/optimization",
				pattern: /^\/api\/ubicazioni\/optimization\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D54u5XjE.js'))
			},
			{
				id: "/api/ubicazioni/picker",
				pattern: /^\/api\/ubicazioni\/picker\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DPr6UOuf.js'))
			},
			{
				id: "/api/ubicazioni/[id]/content",
				pattern: /^\/api\/ubicazioni\/([^/]+?)\/content\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CyhLiiKU.js'))
			},
			{
				id: "/api/udc",
				pattern: /^\/api\/udc\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-cuo3nzDQ.js'))
			},
			{
				id: "/api/unita-misura",
				pattern: /^\/api\/unita-misura\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DfF4wkW7.js'))
			},
			{
				id: "/api/unita-misura/global",
				pattern: /^\/api\/unita-misura\/global\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CQ2F82jR.js'))
			},
			{
				id: "/api/unita-misura/[id]",
				pattern: /^\/api\/unita-misura\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-DL_Tpuew.js'))
			},
			{
				id: "/api/wave-planning",
				pattern: /^\/api\/wave-planning\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Cr7WOXB7.js'))
			},
			{
				id: "/api/wave-planning/performance-report",
				pattern: /^\/api\/wave-planning\/performance-report\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B70hXcnV.js'))
			},
			{
				id: "/api/wave-planning/preview-report",
				pattern: /^\/api\/wave-planning\/preview-report\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BhtcMMwv.js'))
			},
			{
				id: "/api/wave-planning/[id]",
				pattern: /^\/api\/wave-planning\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-dYXY3Vrc.js'))
			},
			{
				id: "/api/wave-planning/[id]/picking-pdf",
				pattern: /^\/api\/wave-planning\/([^/]+?)\/picking-pdf\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-yeefeLda.js'))
			},
			{
				id: "/auth",
				pattern: /^\/auth\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/auth/admin/committenti",
				pattern: /^\/auth\/admin\/committenti\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/auth/admin/committenti/[id]/modifica",
				pattern: /^\/auth\/admin\/committenti\/([^/]+?)\/modifica\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/auth/audit",
				pattern: /^\/auth\/audit\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/auth/categorie",
				pattern: /^\/auth\/categorie\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/auth/causali",
				pattern: /^\/auth\/causali\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/auth/dashboard-compact",
				pattern: /^\/auth\/dashboard-compact\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/auth/dashboard",
				pattern: /^\/auth\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/auth/fornitori",
				pattern: /^\/auth\/fornitori\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/auth/giacenze",
				pattern: /^\/auth\/giacenze\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/auth/magazzini",
				pattern: /^\/auth\/magazzini\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/auth/magazzino",
				pattern: /^\/auth\/magazzino\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/auth/movimenti",
				pattern: /^\/auth\/movimenti\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/auth/movimenti/nuovo",
				pattern: /^\/auth\/movimenti\/nuovo\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/auth/ordini",
				pattern: /^\/auth\/ordini\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/auth/ordini/nuovo",
				pattern: /^\/auth\/ordini\/nuovo\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/auth/ordini/[id]",
				pattern: /^\/auth\/ordini\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/auth/ottimizzazione",
				pattern: /^\/auth\/ottimizzazione\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/auth/prodotti",
				pattern: /^\/auth\/prodotti\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/auth/sistema",
				pattern: /^\/auth\/sistema\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/auth/tipi-udc",
				pattern: /^\/auth\/tipi-udc\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/auth/udc",
				pattern: /^\/auth\/udc\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/auth/udc/[id]",
				pattern: /^\/auth\/udc\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/auth/unita-misura",
				pattern: /^\/auth\/unita-misura\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/auth/utenti",
				pattern: /^\/auth\/utenti\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/auth/wave-planning",
				pattern: /^\/auth\/wave-planning\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/auth/wave-planning/[id]",
				pattern: /^\/auth\/wave-planning\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/logs",
				pattern: /^\/logs\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/test-css",
				pattern: /^\/test-css\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 33 },
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
