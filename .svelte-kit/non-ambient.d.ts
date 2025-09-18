
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/admin" | "/api/admin/categorie" | "/api/admin/categorie/copy" | "/api/admin/committenti" | "/api/admin/committenti/check" | "/api/admin/committenti/stats" | "/api/admin/committenti/with-stats" | "/api/admin/committenti/[id]" | "/api/admin/committenti/[id]/cascade-delete" | "/api/admin/fornitori" | "/api/admin/fornitori/check" | "/api/admin/fornitori/suggestions" | "/api/admin/fornitori/[id]" | "/api/admin/prodotti" | "/api/admin/prodotti/copy" | "/api/admin/unita-misura" | "/api/admin/unita-misura/init" | "/api/categorie" | "/api/categorie/global" | "/api/categorie/[id]" | "/api/causali-trasferimento" | "/api/causali" | "/api/causali/[id]" | "/api/committenti" | "/api/dashboard" | "/api/dashboard/alerts-live" | "/api/dashboard/full-data" | "/api/dashboard/giacenze-live" | "/api/dashboard/kpi-live" | "/api/dashboard/operatori-live" | "/api/forgot-password" | "/api/fornitori" | "/api/fornitori/global" | "/api/fornitori/[id]" | "/api/fornitori/[fornitore_id]" | "/api/fornitori/[fornitore_id]/prodotti" | "/api/giacenze" | "/api/giacenze/global" | "/api/giacenze/realtime" | "/api/logs" | "/api/magazzini" | "/api/magazzini/[id]" | "/api/movimenti" | "/api/movimenti/global" | "/api/ordini" | "/api/prodotti" | "/api/prodotti/global" | "/api/prodotti/[id]" | "/api/test-db" | "/api/tipi-udc" | "/api/tipi-udc/[id]" | "/api/trasferimenti" | "/api/ubicazioni" | "/api/ubicazioni/bulk" | "/api/ubicazioni/optimization" | "/api/ubicazioni/picker" | "/api/ubicazioni/[id]" | "/api/ubicazioni/[id]/content" | "/api/udc" | "/api/unita-misura" | "/api/unita-misura/global" | "/api/unita-misura/[id]" | "/api/wave-planning" | "/api/wave-planning/performance-report" | "/api/wave-planning/preview-report" | "/api/wave-planning/[id]" | "/api/wave-planning/[id]/picking-pdf" | "/auth" | "/auth/admin" | "/auth/admin/committenti" | "/auth/admin/committenti/[id]" | "/auth/admin/committenti/[id]/modifica" | "/auth/audit" | "/auth/categorie" | "/auth/causali" | "/auth/dashboard-compact" | "/auth/dashboard" | "/auth/fornitori" | "/auth/giacenze" | "/auth/login" | "/auth/magazzini" | "/auth/magazzino" | "/auth/movimenti" | "/auth/movimenti/nuovo" | "/auth/ordini" | "/auth/ordini/nuovo" | "/auth/ordini/[id]" | "/auth/ottimizzazione" | "/auth/prodotti" | "/auth/sistema" | "/auth/tipi-udc" | "/auth/transfer" | "/auth/udc" | "/auth/udc/[id]" | "/auth/unita-misura" | "/auth/utenti" | "/auth/wave-planning" | "/auth/wave-planning/[id]" | "/login" | "/logs" | "/reset-password" | "/test-css";
		RouteParams(): {
			"/api/admin/committenti/[id]": { id: string };
			"/api/admin/committenti/[id]/cascade-delete": { id: string };
			"/api/admin/fornitori/[id]": { id: string };
			"/api/categorie/[id]": { id: string };
			"/api/causali/[id]": { id: string };
			"/api/fornitori/[id]": { id: string };
			"/api/fornitori/[fornitore_id]": { fornitore_id: string };
			"/api/fornitori/[fornitore_id]/prodotti": { fornitore_id: string };
			"/api/magazzini/[id]": { id: string };
			"/api/prodotti/[id]": { id: string };
			"/api/tipi-udc/[id]": { id: string };
			"/api/ubicazioni/[id]": { id: string };
			"/api/ubicazioni/[id]/content": { id: string };
			"/api/unita-misura/[id]": { id: string };
			"/api/wave-planning/[id]": { id: string };
			"/api/wave-planning/[id]/picking-pdf": { id: string };
			"/auth/admin/committenti/[id]": { id: string };
			"/auth/admin/committenti/[id]/modifica": { id: string };
			"/auth/ordini/[id]": { id: string };
			"/auth/udc/[id]": { id: string };
			"/auth/wave-planning/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string; fornitore_id?: string };
			"/api": { id?: string; fornitore_id?: string };
			"/api/admin": { id?: string };
			"/api/admin/categorie": Record<string, never>;
			"/api/admin/categorie/copy": Record<string, never>;
			"/api/admin/committenti": { id?: string };
			"/api/admin/committenti/check": Record<string, never>;
			"/api/admin/committenti/stats": Record<string, never>;
			"/api/admin/committenti/with-stats": Record<string, never>;
			"/api/admin/committenti/[id]": { id: string };
			"/api/admin/committenti/[id]/cascade-delete": { id: string };
			"/api/admin/fornitori": { id?: string };
			"/api/admin/fornitori/check": Record<string, never>;
			"/api/admin/fornitori/suggestions": Record<string, never>;
			"/api/admin/fornitori/[id]": { id: string };
			"/api/admin/prodotti": Record<string, never>;
			"/api/admin/prodotti/copy": Record<string, never>;
			"/api/admin/unita-misura": Record<string, never>;
			"/api/admin/unita-misura/init": Record<string, never>;
			"/api/categorie": { id?: string };
			"/api/categorie/global": Record<string, never>;
			"/api/categorie/[id]": { id: string };
			"/api/causali-trasferimento": Record<string, never>;
			"/api/causali": { id?: string };
			"/api/causali/[id]": { id: string };
			"/api/committenti": Record<string, never>;
			"/api/dashboard": Record<string, never>;
			"/api/dashboard/alerts-live": Record<string, never>;
			"/api/dashboard/full-data": Record<string, never>;
			"/api/dashboard/giacenze-live": Record<string, never>;
			"/api/dashboard/kpi-live": Record<string, never>;
			"/api/dashboard/operatori-live": Record<string, never>;
			"/api/forgot-password": Record<string, never>;
			"/api/fornitori": { id?: string; fornitore_id?: string };
			"/api/fornitori/global": Record<string, never>;
			"/api/fornitori/[id]": { id: string };
			"/api/fornitori/[fornitore_id]": { fornitore_id: string };
			"/api/fornitori/[fornitore_id]/prodotti": { fornitore_id: string };
			"/api/giacenze": Record<string, never>;
			"/api/giacenze/global": Record<string, never>;
			"/api/giacenze/realtime": Record<string, never>;
			"/api/logs": Record<string, never>;
			"/api/magazzini": { id?: string };
			"/api/magazzini/[id]": { id: string };
			"/api/movimenti": Record<string, never>;
			"/api/movimenti/global": Record<string, never>;
			"/api/ordini": Record<string, never>;
			"/api/prodotti": { id?: string };
			"/api/prodotti/global": Record<string, never>;
			"/api/prodotti/[id]": { id: string };
			"/api/test-db": Record<string, never>;
			"/api/tipi-udc": { id?: string };
			"/api/tipi-udc/[id]": { id: string };
			"/api/trasferimenti": Record<string, never>;
			"/api/ubicazioni": { id?: string };
			"/api/ubicazioni/bulk": Record<string, never>;
			"/api/ubicazioni/optimization": Record<string, never>;
			"/api/ubicazioni/picker": Record<string, never>;
			"/api/ubicazioni/[id]": { id: string };
			"/api/ubicazioni/[id]/content": { id: string };
			"/api/udc": Record<string, never>;
			"/api/unita-misura": { id?: string };
			"/api/unita-misura/global": Record<string, never>;
			"/api/unita-misura/[id]": { id: string };
			"/api/wave-planning": { id?: string };
			"/api/wave-planning/performance-report": Record<string, never>;
			"/api/wave-planning/preview-report": Record<string, never>;
			"/api/wave-planning/[id]": { id: string };
			"/api/wave-planning/[id]/picking-pdf": { id: string };
			"/auth": { id?: string };
			"/auth/admin": { id?: string };
			"/auth/admin/committenti": { id?: string };
			"/auth/admin/committenti/[id]": { id: string };
			"/auth/admin/committenti/[id]/modifica": { id: string };
			"/auth/audit": Record<string, never>;
			"/auth/categorie": Record<string, never>;
			"/auth/causali": Record<string, never>;
			"/auth/dashboard-compact": Record<string, never>;
			"/auth/dashboard": Record<string, never>;
			"/auth/fornitori": Record<string, never>;
			"/auth/giacenze": Record<string, never>;
			"/auth/login": Record<string, never>;
			"/auth/magazzini": Record<string, never>;
			"/auth/magazzino": Record<string, never>;
			"/auth/movimenti": Record<string, never>;
			"/auth/movimenti/nuovo": Record<string, never>;
			"/auth/ordini": { id?: string };
			"/auth/ordini/nuovo": Record<string, never>;
			"/auth/ordini/[id]": { id: string };
			"/auth/ottimizzazione": Record<string, never>;
			"/auth/prodotti": Record<string, never>;
			"/auth/sistema": Record<string, never>;
			"/auth/tipi-udc": Record<string, never>;
			"/auth/transfer": Record<string, never>;
			"/auth/udc": { id?: string };
			"/auth/udc/[id]": { id: string };
			"/auth/unita-misura": Record<string, never>;
			"/auth/utenti": Record<string, never>;
			"/auth/wave-planning": { id?: string };
			"/auth/wave-planning/[id]": { id: string };
			"/login": Record<string, never>;
			"/logs": Record<string, never>;
			"/reset-password": Record<string, never>;
			"/test-css": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/admin" | "/api/admin/" | "/api/admin/categorie" | "/api/admin/categorie/" | "/api/admin/categorie/copy" | "/api/admin/categorie/copy/" | "/api/admin/committenti" | "/api/admin/committenti/" | "/api/admin/committenti/check" | "/api/admin/committenti/check/" | "/api/admin/committenti/stats" | "/api/admin/committenti/stats/" | "/api/admin/committenti/with-stats" | "/api/admin/committenti/with-stats/" | `/api/admin/committenti/${string}` & {} | `/api/admin/committenti/${string}/` & {} | `/api/admin/committenti/${string}/cascade-delete` & {} | `/api/admin/committenti/${string}/cascade-delete/` & {} | "/api/admin/fornitori" | "/api/admin/fornitori/" | "/api/admin/fornitori/check" | "/api/admin/fornitori/check/" | "/api/admin/fornitori/suggestions" | "/api/admin/fornitori/suggestions/" | `/api/admin/fornitori/${string}` & {} | `/api/admin/fornitori/${string}/` & {} | "/api/admin/prodotti" | "/api/admin/prodotti/" | "/api/admin/prodotti/copy" | "/api/admin/prodotti/copy/" | "/api/admin/unita-misura" | "/api/admin/unita-misura/" | "/api/admin/unita-misura/init" | "/api/admin/unita-misura/init/" | "/api/categorie" | "/api/categorie/" | "/api/categorie/global" | "/api/categorie/global/" | `/api/categorie/${string}` & {} | `/api/categorie/${string}/` & {} | "/api/causali-trasferimento" | "/api/causali-trasferimento/" | "/api/causali" | "/api/causali/" | `/api/causali/${string}` & {} | `/api/causali/${string}/` & {} | "/api/committenti" | "/api/committenti/" | "/api/dashboard" | "/api/dashboard/" | "/api/dashboard/alerts-live" | "/api/dashboard/alerts-live/" | "/api/dashboard/full-data" | "/api/dashboard/full-data/" | "/api/dashboard/giacenze-live" | "/api/dashboard/giacenze-live/" | "/api/dashboard/kpi-live" | "/api/dashboard/kpi-live/" | "/api/dashboard/operatori-live" | "/api/dashboard/operatori-live/" | "/api/forgot-password" | "/api/forgot-password/" | "/api/fornitori" | "/api/fornitori/" | "/api/fornitori/global" | "/api/fornitori/global/" | `/api/fornitori/${string}` & {} | `/api/fornitori/${string}/` & {} | `/api/fornitori/${string}/prodotti` & {} | `/api/fornitori/${string}/prodotti/` & {} | "/api/giacenze" | "/api/giacenze/" | "/api/giacenze/global" | "/api/giacenze/global/" | "/api/giacenze/realtime" | "/api/giacenze/realtime/" | "/api/logs" | "/api/logs/" | "/api/magazzini" | "/api/magazzini/" | `/api/magazzini/${string}` & {} | `/api/magazzini/${string}/` & {} | "/api/movimenti" | "/api/movimenti/" | "/api/movimenti/global" | "/api/movimenti/global/" | "/api/ordini" | "/api/ordini/" | "/api/prodotti" | "/api/prodotti/" | "/api/prodotti/global" | "/api/prodotti/global/" | `/api/prodotti/${string}` & {} | `/api/prodotti/${string}/` & {} | "/api/test-db" | "/api/test-db/" | "/api/tipi-udc" | "/api/tipi-udc/" | `/api/tipi-udc/${string}` & {} | `/api/tipi-udc/${string}/` & {} | "/api/trasferimenti" | "/api/trasferimenti/" | "/api/ubicazioni" | "/api/ubicazioni/" | "/api/ubicazioni/bulk" | "/api/ubicazioni/bulk/" | "/api/ubicazioni/optimization" | "/api/ubicazioni/optimization/" | "/api/ubicazioni/picker" | "/api/ubicazioni/picker/" | `/api/ubicazioni/${string}` & {} | `/api/ubicazioni/${string}/` & {} | `/api/ubicazioni/${string}/content` & {} | `/api/ubicazioni/${string}/content/` & {} | "/api/udc" | "/api/udc/" | "/api/unita-misura" | "/api/unita-misura/" | "/api/unita-misura/global" | "/api/unita-misura/global/" | `/api/unita-misura/${string}` & {} | `/api/unita-misura/${string}/` & {} | "/api/wave-planning" | "/api/wave-planning/" | "/api/wave-planning/performance-report" | "/api/wave-planning/performance-report/" | "/api/wave-planning/preview-report" | "/api/wave-planning/preview-report/" | `/api/wave-planning/${string}` & {} | `/api/wave-planning/${string}/` & {} | `/api/wave-planning/${string}/picking-pdf` & {} | `/api/wave-planning/${string}/picking-pdf/` & {} | "/auth" | "/auth/" | "/auth/admin" | "/auth/admin/" | "/auth/admin/committenti" | "/auth/admin/committenti/" | `/auth/admin/committenti/${string}` & {} | `/auth/admin/committenti/${string}/` & {} | `/auth/admin/committenti/${string}/modifica` & {} | `/auth/admin/committenti/${string}/modifica/` & {} | "/auth/audit" | "/auth/audit/" | "/auth/categorie" | "/auth/categorie/" | "/auth/causali" | "/auth/causali/" | "/auth/dashboard-compact" | "/auth/dashboard-compact/" | "/auth/dashboard" | "/auth/dashboard/" | "/auth/fornitori" | "/auth/fornitori/" | "/auth/giacenze" | "/auth/giacenze/" | "/auth/login" | "/auth/login/" | "/auth/magazzini" | "/auth/magazzini/" | "/auth/magazzino" | "/auth/magazzino/" | "/auth/movimenti" | "/auth/movimenti/" | "/auth/movimenti/nuovo" | "/auth/movimenti/nuovo/" | "/auth/ordini" | "/auth/ordini/" | "/auth/ordini/nuovo" | "/auth/ordini/nuovo/" | `/auth/ordini/${string}` & {} | `/auth/ordini/${string}/` & {} | "/auth/ottimizzazione" | "/auth/ottimizzazione/" | "/auth/prodotti" | "/auth/prodotti/" | "/auth/sistema" | "/auth/sistema/" | "/auth/tipi-udc" | "/auth/tipi-udc/" | "/auth/transfer" | "/auth/transfer/" | "/auth/udc" | "/auth/udc/" | `/auth/udc/${string}` & {} | `/auth/udc/${string}/` & {} | "/auth/unita-misura" | "/auth/unita-misura/" | "/auth/utenti" | "/auth/utenti/" | "/auth/wave-planning" | "/auth/wave-planning/" | `/auth/wave-planning/${string}` & {} | `/auth/wave-planning/${string}/` & {} | "/login" | "/login/" | "/logs" | "/logs/" | "/reset-password" | "/reset-password/" | "/test-css" | "/test-css/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.ico" | "/favicon.png" | "/morlappo-logo-dark.png" | "/morlappo-logo-white.png" | "/morlappo-logo.png" | "/placeholder-analytics.svg" | "/placeholder-dashboard.svg" | "/placeholder-movements.svg" | "/placeholder-products.svg" | "/sw.js" | string & {};
	}
}