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
		client: {start:"_app/immutable/entry/start.DoDTn5th.js",app:"_app/immutable/entry/app.DoqsnnRW.js",imports:["_app/immutable/entry/start.DoDTn5th.js","_app/immutable/chunks/LdG326yf.js","_app/immutable/chunks/DgOuP6Wg.js","_app/immutable/chunks/MRHd1TOL.js","_app/immutable/chunks/BJtOIY6P.js","_app/immutable/chunks/CC12XucS.js","_app/immutable/entry/app.DoqsnnRW.js","_app/immutable/chunks/MRHd1TOL.js","_app/immutable/chunks/BJtOIY6P.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DgOuP6Wg.js","_app/immutable/chunks/htRfjTuE.js","_app/immutable/chunks/Co-2ZPTv.js","_app/immutable/chunks/B-0RTpKP.js","_app/immutable/chunks/CC12XucS.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-CMpZCqG8.js')),
			__memo(() => import('./chunks/1-CiZ-ICmt.js')),
			__memo(() => import('./chunks/2-B-hJOJBl.js')),
			__memo(() => import('./chunks/3--Y-8MILY.js')),
			__memo(() => import('./chunks/4-Dw5qmTwH.js')),
			__memo(() => import('./chunks/5-DUNcvtZL.js')),
			__memo(() => import('./chunks/6-mRH2DqIY.js')),
			__memo(() => import('./chunks/7-Swc-dQ8z.js')),
			__memo(() => import('./chunks/8-PDjwMHeC.js')),
			__memo(() => import('./chunks/9-DFyqhU63.js')),
			__memo(() => import('./chunks/10-DfUVtR8d.js')),
			__memo(() => import('./chunks/11-BYfeIPKk.js')),
			__memo(() => import('./chunks/12-DKxby8Hn.js')),
			__memo(() => import('./chunks/13-Dzp0geqh.js')),
			__memo(() => import('./chunks/14-CcW1g8A9.js')),
			__memo(() => import('./chunks/15-WT743JZj.js')),
			__memo(() => import('./chunks/16-CKJcGfVr.js')),
			__memo(() => import('./chunks/17-BdYElgVn.js')),
			__memo(() => import('./chunks/18-DlkA2MoU.js')),
			__memo(() => import('./chunks/19-7lItTR5q.js')),
			__memo(() => import('./chunks/20-iM1mpN8J.js')),
			__memo(() => import('./chunks/21-Ca04bxxh.js')),
			__memo(() => import('./chunks/22-DQVg0T6r.js')),
			__memo(() => import('./chunks/23-DY1MpYNH.js')),
			__memo(() => import('./chunks/24-CPifN2zY.js')),
			__memo(() => import('./chunks/25-f9ec8ont.js')),
			__memo(() => import('./chunks/26-DlgxQraP.js')),
			__memo(() => import('./chunks/27-D_7uziNN.js')),
			__memo(() => import('./chunks/28-CqnK8ddZ.js')),
			__memo(() => import('./chunks/29-JT_86Qc1.js')),
			__memo(() => import('./chunks/30-BQSdxfyW.js')),
			__memo(() => import('./chunks/31-COM5TGf4.js')),
			__memo(() => import('./chunks/32-Cv36fZqd.js')),
			__memo(() => import('./chunks/33-DssWrG6f.js')),
			__memo(() => import('./chunks/34-BIrYFC-4.js')),
			__memo(() => import('./chunks/35-C0649pyD.js')),
			__memo(() => import('./chunks/36-D_YLmpVn.js')),
			__memo(() => import('./chunks/37-DWE30PZd.js')),
			__memo(() => import('./chunks/38-Cep0HCri.js')),
			__memo(() => import('./chunks/39-CI8MhwXU.js')),
			__memo(() => import('./chunks/40-CFYT90gE.js')),
			__memo(() => import('./chunks/41-Cn6Yrew9.js')),
			__memo(() => import('./chunks/42-DfLc_8Tp.js')),
			__memo(() => import('./chunks/43-CCe_S7G9.js')),
			__memo(() => import('./chunks/44-Bn70V0up.js')),
			__memo(() => import('./chunks/45-BE490V7H.js')),
			__memo(() => import('./chunks/46-DhO_jfVT.js')),
			__memo(() => import('./chunks/47-B2l_ZU-Q.js')),
			__memo(() => import('./chunks/48-DBgN6Pkj.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/api/admin/categorie/copy",
				pattern: /^\/api\/admin\/categorie\/copy\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-B4FwpcYt.js'))
			},
			{
				id: "/api/admin/committenti",
				pattern: /^\/api\/admin\/committenti\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-VdSefRBD.js'))
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
				endpoint: __memo(() => import('./chunks/_server.ts-BXVyUea_.js'))
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
				endpoint: __memo(() => import('./chunks/_server.ts-Ccuofvsf.js'))
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
				endpoint: __memo(() => import('./chunks/_server.ts-DxZAohkp.js'))
			},
			{
				id: "/api/admin/fornitori/[id]",
				pattern: /^\/api\/admin\/fornitori\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BMHn-FgX.js'))
			},
			{
				id: "/api/admin/prodotti/copy",
				pattern: /^\/api\/admin\/prodotti\/copy\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BH77XHob.js'))
			},
			{
				id: "/api/admin/unita-misura",
				pattern: /^\/api\/admin\/unita-misura\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-hJ84k_GW.js'))
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
				endpoint: __memo(() => import('./chunks/_server-w68OceN9.js'))
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
				endpoint: __memo(() => import('./chunks/_server-BZ5uF9kD.js'))
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
				id: "/api/committenti/[committente_id]/categorie",
				pattern: /^\/api\/committenti\/([^/]+?)\/categorie\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BGXXyFwb.js'))
			},
			{
				id: "/api/committenti/[committente_id]/categorie/check",
				pattern: /^\/api\/committenti\/([^/]+?)\/categorie\/check\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D3RHQBXQ.js'))
			},
			{
				id: "/api/committenti/[committente_id]/categorie/[id]",
				pattern: /^\/api\/committenti\/([^/]+?)\/categorie\/([^/]+?)\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false},{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BBOUkFDD.js'))
			},
			{
				id: "/api/committenti/[committente_id]/fornitori",
				pattern: /^\/api\/committenti\/([^/]+?)\/fornitori\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DERcYLn5.js'))
			},
			{
				id: "/api/committenti/[committente_id]/fornitori/associate",
				pattern: /^\/api\/committenti\/([^/]+?)\/fornitori\/associate\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CYl8JiS9.js'))
			},
			{
				id: "/api/committenti/[committente_id]/fornitori/[fornitore_id]",
				pattern: /^\/api\/committenti\/([^/]+?)\/fornitori\/([^/]+?)\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false},{"name":"fornitore_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BlE2qt-F.js'))
			},
			{
				id: "/api/committenti/[committente_id]/giacenze",
				pattern: /^\/api\/committenti\/([^/]+?)\/giacenze\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-1C3U05sS.js'))
			},
			{
				id: "/api/committenti/[committente_id]/giacenze/scorta-bassa",
				pattern: /^\/api\/committenti\/([^/]+?)\/giacenze\/scorta-bassa\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BfnaaWAf.js'))
			},
			{
				id: "/api/committenti/[committente_id]/giacenze/[prodotto_id]",
				pattern: /^\/api\/committenti\/([^/]+?)\/giacenze\/([^/]+?)\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false},{"name":"prodotto_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DM4Y431E.js'))
			},
			{
				id: "/api/committenti/[committente_id]/inventari",
				pattern: /^\/api\/committenti\/([^/]+?)\/inventari\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CEGXrRWv.js'))
			},
			{
				id: "/api/committenti/[committente_id]/inventari/[inventario_id]",
				pattern: /^\/api\/committenti\/([^/]+?)\/inventari\/([^/]+?)\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false},{"name":"inventario_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BEtpu5-O.js'))
			},
			{
				id: "/api/committenti/[committente_id]/inventari/[inventario_id]/actions",
				pattern: /^\/api\/committenti\/([^/]+?)\/inventari\/([^/]+?)\/actions\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false},{"name":"inventario_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CpEavQP9.js'))
			},
			{
				id: "/api/committenti/[committente_id]/inventari/[inventario_id]/conteggi",
				pattern: /^\/api\/committenti\/([^/]+?)\/inventari\/([^/]+?)\/conteggi\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false},{"name":"inventario_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-9Flyc8U_.js'))
			},
			{
				id: "/api/committenti/[committente_id]/inventari/[inventario_id]/conteggi/[prodotto_id]",
				pattern: /^\/api\/committenti\/([^/]+?)\/inventari\/([^/]+?)\/conteggi\/([^/]+?)\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false},{"name":"inventario_id","optional":false,"rest":false,"chained":false},{"name":"prodotto_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-2JEmTG2q.js'))
			},
			{
				id: "/api/committenti/[committente_id]/movimenti",
				pattern: /^\/api\/committenti\/([^/]+?)\/movimenti\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Dx2WPdAv.js'))
			},
			{
				id: "/api/committenti/[committente_id]/movimenti/dropdown-data",
				pattern: /^\/api\/committenti\/([^/]+?)\/movimenti\/dropdown-data\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BRJSKZoh.js'))
			},
			{
				id: "/api/committenti/[committente_id]/movimenti/[movimento_id]",
				pattern: /^\/api\/committenti\/([^/]+?)\/movimenti\/([^/]+?)\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false},{"name":"movimento_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-AK7Y6OTE.js'))
			},
			{
				id: "/api/committenti/[committente_id]/prodotti",
				pattern: /^\/api\/committenti\/([^/]+?)\/prodotti\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-BDEKMukH.js'))
			},
			{
				id: "/api/committenti/[committente_id]/prodotti/check",
				pattern: /^\/api\/committenti\/([^/]+?)\/prodotti\/check\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-wRaXXP50.js'))
			},
			{
				id: "/api/committenti/[committente_id]/prodotti/scorte-basse",
				pattern: /^\/api\/committenti\/([^/]+?)\/prodotti\/scorte-basse\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DH3qyUqx.js'))
			},
			{
				id: "/api/committenti/[committente_id]/prodotti/suggestions",
				pattern: /^\/api\/committenti\/([^/]+?)\/prodotti\/suggestions\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DPq-Mg7i.js'))
			},
			{
				id: "/api/committenti/[committente_id]/prodotti/[id]",
				pattern: /^\/api\/committenti\/([^/]+?)\/prodotti\/([^/]+?)\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false},{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-D093aQSw.js'))
			},
			{
				id: "/api/committenti/[committente_id]/unita-misura",
				pattern: /^\/api\/committenti\/([^/]+?)\/unita-misura\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-Ci-NUPzr.js'))
			},
			{
				id: "/api/committenti/[committente_id]/unita-misura/check",
				pattern: /^\/api\/committenti\/([^/]+?)\/unita-misura\/check\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-DRtKK5Tn.js'))
			},
			{
				id: "/api/committenti/[committente_id]/unita-misura/suggestions",
				pattern: /^\/api\/committenti\/([^/]+?)\/unita-misura\/suggestions\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CNIuzEvo.js'))
			},
			{
				id: "/api/committenti/[committente_id]/unita-misura/[id]",
				pattern: /^\/api\/committenti\/([^/]+?)\/unita-misura\/([^/]+?)\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false},{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-COejjL8q.js'))
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
				endpoint: __memo(() => import('./chunks/_server-COgr-EGA.js'))
			},
			{
				id: "/api/fornitori/global",
				pattern: /^\/api\/fornitori\/global\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CADbc6YA.js'))
			},
			{
				id: "/api/fornitori/[id]",
				pattern: /^\/api\/fornitori\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-C5eLx07t.js'))
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
				endpoint: __memo(() => import('./chunks/_server-CRe8pxHb.js'))
			},
			{
				id: "/api/magazzini/[id]",
				pattern: /^\/api\/magazzini\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-COhgGsAQ.js'))
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
				endpoint: __memo(() => import('./chunks/_server.ts-BhxCXIft.js'))
			},
			{
				id: "/api/tipi-udc/[id]",
				pattern: /^\/api\/tipi-udc\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server-CyYHzNBd.js'))
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
				endpoint: __memo(() => import('./chunks/_server-CEvAWpfY.js'))
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
				endpoint: __memo(() => import('./chunks/_server-JzyByIfQ.js'))
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
				page: { layouts: [0,2,], errors: [1,,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/auth/admin/committenti",
				pattern: /^\/auth\/admin\/committenti\/?$/,
				params: [],
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
				id: "/auth/committenti",
				pattern: /^\/auth\/committenti\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]",
				pattern: /^\/auth\/committenti\/([^/]+?)\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/categorie",
				pattern: /^\/auth\/committenti\/([^/]+?)\/categorie\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/fornitori",
				pattern: /^\/auth\/committenti\/([^/]+?)\/fornitori\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/giacenze",
				pattern: /^\/auth\/committenti\/([^/]+?)\/giacenze\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/giacenze/scorta-bassa",
				pattern: /^\/auth\/committenti\/([^/]+?)\/giacenze\/scorta-bassa\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/inventari",
				pattern: /^\/auth\/committenti\/([^/]+?)\/inventari\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/inventari/[inventario_id]",
				pattern: /^\/auth\/committenti\/([^/]+?)\/inventari\/([^/]+?)\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false},{"name":"inventario_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/magazzino",
				pattern: /^\/auth\/committenti\/([^/]+?)\/magazzino\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/movimenti-simple",
				pattern: /^\/auth\/committenti\/([^/]+?)\/movimenti-simple\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/movimenti",
				pattern: /^\/auth\/committenti\/([^/]+?)\/movimenti\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/movimenti/debug",
				pattern: /^\/auth\/committenti\/([^/]+?)\/movimenti\/debug\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/prodotti",
				pattern: /^\/auth\/committenti\/([^/]+?)\/prodotti\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/super-simple",
				pattern: /^\/auth\/committenti\/([^/]+?)\/super-simple\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/test-js",
				pattern: /^\/auth\/committenti\/([^/]+?)\/test-js\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/auth/committenti/[committente_id]/unita-misura",
				pattern: /^\/auth\/committenti\/([^/]+?)\/unita-misura\/?$/,
				params: [{"name":"committente_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/auth/dashboard",
				pattern: /^\/auth\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/auth/fornitori",
				pattern: /^\/auth\/fornitori\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/auth/giacenze",
				pattern: /^\/auth\/giacenze\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/auth/magazzini",
				pattern: /^\/auth\/magazzini\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/auth/magazzino",
				pattern: /^\/auth\/magazzino\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/auth/movimenti",
				pattern: /^\/auth\/movimenti\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/auth/movimenti/nuovo",
				pattern: /^\/auth\/movimenti\/nuovo\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/auth/ordini",
				pattern: /^\/auth\/ordini\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 33 },
				endpoint: null
			},
			{
				id: "/auth/ordini/nuovo",
				pattern: /^\/auth\/ordini\/nuovo\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 35 },
				endpoint: null
			},
			{
				id: "/auth/ordini/[id]",
				pattern: /^\/auth\/ordini\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 34 },
				endpoint: null
			},
			{
				id: "/auth/ottimizzazione",
				pattern: /^\/auth\/ottimizzazione\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 36 },
				endpoint: null
			},
			{
				id: "/auth/prodotti",
				pattern: /^\/auth\/prodotti\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 37 },
				endpoint: null
			},
			{
				id: "/auth/sistema",
				pattern: /^\/auth\/sistema\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 38 },
				endpoint: null
			},
			{
				id: "/auth/tipi-udc",
				pattern: /^\/auth\/tipi-udc\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 39 },
				endpoint: null
			},
			{
				id: "/auth/udc",
				pattern: /^\/auth\/udc\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 40 },
				endpoint: null
			},
			{
				id: "/auth/udc/[id]",
				pattern: /^\/auth\/udc\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 41 },
				endpoint: null
			},
			{
				id: "/auth/unita-misura",
				pattern: /^\/auth\/unita-misura\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 42 },
				endpoint: null
			},
			{
				id: "/auth/utenti",
				pattern: /^\/auth\/utenti\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 43 },
				endpoint: null
			},
			{
				id: "/auth/wave-planning",
				pattern: /^\/auth\/wave-planning\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 44 },
				endpoint: null
			},
			{
				id: "/auth/wave-planning/[id]",
				pattern: /^\/auth\/wave-planning\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 45 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 46 },
				endpoint: null
			},
			{
				id: "/logs",
				pattern: /^\/logs\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 47 },
				endpoint: null
			},
			{
				id: "/test-css",
				pattern: /^\/test-css\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 48 },
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
