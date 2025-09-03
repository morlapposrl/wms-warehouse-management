
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
		RouteId(): "/" | "/api" | "/api/admin" | "/api/admin/categorie" | "/api/admin/categorie/copy" | "/api/admin/committenti" | "/api/admin/committenti/check" | "/api/admin/committenti/stats" | "/api/admin/committenti/with-stats" | "/api/admin/committenti/[id]" | "/api/admin/fornitori" | "/api/admin/fornitori/check" | "/api/admin/fornitori/suggestions" | "/api/admin/fornitori/[id]" | "/api/admin/prodotti" | "/api/admin/prodotti/copy" | "/api/admin/unita-misura" | "/api/admin/unita-misura/init" | "/api/committenti" | "/api/committenti/[committente_id]" | "/api/committenti/[committente_id]/categorie" | "/api/committenti/[committente_id]/categorie/check" | "/api/committenti/[committente_id]/categorie/[id]" | "/api/committenti/[committente_id]/fornitori" | "/api/committenti/[committente_id]/fornitori/associate" | "/api/committenti/[committente_id]/fornitori/[fornitore_id]" | "/api/committenti/[committente_id]/giacenze" | "/api/committenti/[committente_id]/giacenze/scorta-bassa" | "/api/committenti/[committente_id]/giacenze/[prodotto_id]" | "/api/committenti/[committente_id]/inventari" | "/api/committenti/[committente_id]/inventari/[inventario_id]" | "/api/committenti/[committente_id]/inventari/[inventario_id]/actions" | "/api/committenti/[committente_id]/inventari/[inventario_id]/conteggi" | "/api/committenti/[committente_id]/inventari/[inventario_id]/conteggi/[prodotto_id]" | "/api/committenti/[committente_id]/movimenti" | "/api/committenti/[committente_id]/movimenti/dropdown-data" | "/api/committenti/[committente_id]/movimenti/[movimento_id]" | "/api/committenti/[committente_id]/prodotti" | "/api/committenti/[committente_id]/prodotti/check" | "/api/committenti/[committente_id]/prodotti/scorte-basse" | "/api/committenti/[committente_id]/prodotti/suggestions" | "/api/committenti/[committente_id]/prodotti/[id]" | "/api/committenti/[committente_id]/unita-misura" | "/api/committenti/[committente_id]/unita-misura/check" | "/api/committenti/[committente_id]/unita-misura/suggestions" | "/api/committenti/[committente_id]/unita-misura/[id]" | "/api/fornitori" | "/api/fornitori/[fornitore_id]" | "/api/fornitori/[fornitore_id]/prodotti" | "/api/giacenze" | "/api/giacenze/global" | "/api/movimenti" | "/api/movimenti/global" | "/api/prodotti" | "/api/prodotti/global" | "/auth" | "/auth/admin" | "/auth/admin/committenti" | "/auth/committenti" | "/auth/committenti/[committente_id]" | "/auth/committenti/[committente_id]/categorie" | "/auth/committenti/[committente_id]/fornitori" | "/auth/committenti/[committente_id]/giacenze" | "/auth/committenti/[committente_id]/giacenze/scorta-bassa" | "/auth/committenti/[committente_id]/inventari" | "/auth/committenti/[committente_id]/inventari/[inventario_id]" | "/auth/committenti/[committente_id]/magazzino" | "/auth/committenti/[committente_id]/movimenti-simple" | "/auth/committenti/[committente_id]/movimenti" | "/auth/committenti/[committente_id]/movimenti/debug" | "/auth/committenti/[committente_id]/prodotti" | "/auth/committenti/[committente_id]/super-simple" | "/auth/committenti/[committente_id]/test-js" | "/auth/committenti/[committente_id]/unita-misura" | "/auth/dashboard" | "/auth/giacenze" | "/auth/login" | "/auth/movimenti" | "/auth/ordini" | "/auth/ordini/nuovo" | "/auth/ordini/[id]" | "/auth/ottimizzazione" | "/auth/prodotti" | "/auth/wave-planning" | "/test-css";
		RouteParams(): {
			"/api/admin/committenti/[id]": { id: string };
			"/api/admin/fornitori/[id]": { id: string };
			"/api/committenti/[committente_id]": { committente_id: string };
			"/api/committenti/[committente_id]/categorie": { committente_id: string };
			"/api/committenti/[committente_id]/categorie/check": { committente_id: string };
			"/api/committenti/[committente_id]/categorie/[id]": { committente_id: string; id: string };
			"/api/committenti/[committente_id]/fornitori": { committente_id: string };
			"/api/committenti/[committente_id]/fornitori/associate": { committente_id: string };
			"/api/committenti/[committente_id]/fornitori/[fornitore_id]": { committente_id: string; fornitore_id: string };
			"/api/committenti/[committente_id]/giacenze": { committente_id: string };
			"/api/committenti/[committente_id]/giacenze/scorta-bassa": { committente_id: string };
			"/api/committenti/[committente_id]/giacenze/[prodotto_id]": { committente_id: string; prodotto_id: string };
			"/api/committenti/[committente_id]/inventari": { committente_id: string };
			"/api/committenti/[committente_id]/inventari/[inventario_id]": { committente_id: string; inventario_id: string };
			"/api/committenti/[committente_id]/inventari/[inventario_id]/actions": { committente_id: string; inventario_id: string };
			"/api/committenti/[committente_id]/inventari/[inventario_id]/conteggi": { committente_id: string; inventario_id: string };
			"/api/committenti/[committente_id]/inventari/[inventario_id]/conteggi/[prodotto_id]": { committente_id: string; inventario_id: string; prodotto_id: string };
			"/api/committenti/[committente_id]/movimenti": { committente_id: string };
			"/api/committenti/[committente_id]/movimenti/dropdown-data": { committente_id: string };
			"/api/committenti/[committente_id]/movimenti/[movimento_id]": { committente_id: string; movimento_id: string };
			"/api/committenti/[committente_id]/prodotti": { committente_id: string };
			"/api/committenti/[committente_id]/prodotti/check": { committente_id: string };
			"/api/committenti/[committente_id]/prodotti/scorte-basse": { committente_id: string };
			"/api/committenti/[committente_id]/prodotti/suggestions": { committente_id: string };
			"/api/committenti/[committente_id]/prodotti/[id]": { committente_id: string; id: string };
			"/api/committenti/[committente_id]/unita-misura": { committente_id: string };
			"/api/committenti/[committente_id]/unita-misura/check": { committente_id: string };
			"/api/committenti/[committente_id]/unita-misura/suggestions": { committente_id: string };
			"/api/committenti/[committente_id]/unita-misura/[id]": { committente_id: string; id: string };
			"/api/fornitori/[fornitore_id]": { fornitore_id: string };
			"/api/fornitori/[fornitore_id]/prodotti": { fornitore_id: string };
			"/auth/committenti/[committente_id]": { committente_id: string };
			"/auth/committenti/[committente_id]/categorie": { committente_id: string };
			"/auth/committenti/[committente_id]/fornitori": { committente_id: string };
			"/auth/committenti/[committente_id]/giacenze": { committente_id: string };
			"/auth/committenti/[committente_id]/giacenze/scorta-bassa": { committente_id: string };
			"/auth/committenti/[committente_id]/inventari": { committente_id: string };
			"/auth/committenti/[committente_id]/inventari/[inventario_id]": { committente_id: string; inventario_id: string };
			"/auth/committenti/[committente_id]/magazzino": { committente_id: string };
			"/auth/committenti/[committente_id]/movimenti-simple": { committente_id: string };
			"/auth/committenti/[committente_id]/movimenti": { committente_id: string };
			"/auth/committenti/[committente_id]/movimenti/debug": { committente_id: string };
			"/auth/committenti/[committente_id]/prodotti": { committente_id: string };
			"/auth/committenti/[committente_id]/super-simple": { committente_id: string };
			"/auth/committenti/[committente_id]/test-js": { committente_id: string };
			"/auth/committenti/[committente_id]/unita-misura": { committente_id: string };
			"/auth/ordini/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string; committente_id?: string; fornitore_id?: string; prodotto_id?: string; inventario_id?: string; movimento_id?: string };
			"/api": { id?: string; committente_id?: string; fornitore_id?: string; prodotto_id?: string; inventario_id?: string; movimento_id?: string };
			"/api/admin": { id?: string };
			"/api/admin/categorie": Record<string, never>;
			"/api/admin/categorie/copy": Record<string, never>;
			"/api/admin/committenti": { id?: string };
			"/api/admin/committenti/check": Record<string, never>;
			"/api/admin/committenti/stats": Record<string, never>;
			"/api/admin/committenti/with-stats": Record<string, never>;
			"/api/admin/committenti/[id]": { id: string };
			"/api/admin/fornitori": { id?: string };
			"/api/admin/fornitori/check": Record<string, never>;
			"/api/admin/fornitori/suggestions": Record<string, never>;
			"/api/admin/fornitori/[id]": { id: string };
			"/api/admin/prodotti": Record<string, never>;
			"/api/admin/prodotti/copy": Record<string, never>;
			"/api/admin/unita-misura": Record<string, never>;
			"/api/admin/unita-misura/init": Record<string, never>;
			"/api/committenti": { committente_id?: string; id?: string; fornitore_id?: string; prodotto_id?: string; inventario_id?: string; movimento_id?: string };
			"/api/committenti/[committente_id]": { committente_id: string; id?: string; fornitore_id?: string; prodotto_id?: string; inventario_id?: string; movimento_id?: string };
			"/api/committenti/[committente_id]/categorie": { committente_id: string; id?: string };
			"/api/committenti/[committente_id]/categorie/check": { committente_id: string };
			"/api/committenti/[committente_id]/categorie/[id]": { committente_id: string; id: string };
			"/api/committenti/[committente_id]/fornitori": { committente_id: string; fornitore_id?: string };
			"/api/committenti/[committente_id]/fornitori/associate": { committente_id: string };
			"/api/committenti/[committente_id]/fornitori/[fornitore_id]": { committente_id: string; fornitore_id: string };
			"/api/committenti/[committente_id]/giacenze": { committente_id: string; prodotto_id?: string };
			"/api/committenti/[committente_id]/giacenze/scorta-bassa": { committente_id: string };
			"/api/committenti/[committente_id]/giacenze/[prodotto_id]": { committente_id: string; prodotto_id: string };
			"/api/committenti/[committente_id]/inventari": { committente_id: string; inventario_id?: string; prodotto_id?: string };
			"/api/committenti/[committente_id]/inventari/[inventario_id]": { committente_id: string; inventario_id: string; prodotto_id?: string };
			"/api/committenti/[committente_id]/inventari/[inventario_id]/actions": { committente_id: string; inventario_id: string };
			"/api/committenti/[committente_id]/inventari/[inventario_id]/conteggi": { committente_id: string; inventario_id: string; prodotto_id?: string };
			"/api/committenti/[committente_id]/inventari/[inventario_id]/conteggi/[prodotto_id]": { committente_id: string; inventario_id: string; prodotto_id: string };
			"/api/committenti/[committente_id]/movimenti": { committente_id: string; movimento_id?: string };
			"/api/committenti/[committente_id]/movimenti/dropdown-data": { committente_id: string };
			"/api/committenti/[committente_id]/movimenti/[movimento_id]": { committente_id: string; movimento_id: string };
			"/api/committenti/[committente_id]/prodotti": { committente_id: string; id?: string };
			"/api/committenti/[committente_id]/prodotti/check": { committente_id: string };
			"/api/committenti/[committente_id]/prodotti/scorte-basse": { committente_id: string };
			"/api/committenti/[committente_id]/prodotti/suggestions": { committente_id: string };
			"/api/committenti/[committente_id]/prodotti/[id]": { committente_id: string; id: string };
			"/api/committenti/[committente_id]/unita-misura": { committente_id: string; id?: string };
			"/api/committenti/[committente_id]/unita-misura/check": { committente_id: string };
			"/api/committenti/[committente_id]/unita-misura/suggestions": { committente_id: string };
			"/api/committenti/[committente_id]/unita-misura/[id]": { committente_id: string; id: string };
			"/api/fornitori": { fornitore_id?: string };
			"/api/fornitori/[fornitore_id]": { fornitore_id: string };
			"/api/fornitori/[fornitore_id]/prodotti": { fornitore_id: string };
			"/api/giacenze": Record<string, never>;
			"/api/giacenze/global": Record<string, never>;
			"/api/movimenti": Record<string, never>;
			"/api/movimenti/global": Record<string, never>;
			"/api/prodotti": Record<string, never>;
			"/api/prodotti/global": Record<string, never>;
			"/auth": { committente_id?: string; inventario_id?: string; id?: string };
			"/auth/admin": Record<string, never>;
			"/auth/admin/committenti": Record<string, never>;
			"/auth/committenti": { committente_id?: string; inventario_id?: string };
			"/auth/committenti/[committente_id]": { committente_id: string; inventario_id?: string };
			"/auth/committenti/[committente_id]/categorie": { committente_id: string };
			"/auth/committenti/[committente_id]/fornitori": { committente_id: string };
			"/auth/committenti/[committente_id]/giacenze": { committente_id: string };
			"/auth/committenti/[committente_id]/giacenze/scorta-bassa": { committente_id: string };
			"/auth/committenti/[committente_id]/inventari": { committente_id: string; inventario_id?: string };
			"/auth/committenti/[committente_id]/inventari/[inventario_id]": { committente_id: string; inventario_id: string };
			"/auth/committenti/[committente_id]/magazzino": { committente_id: string };
			"/auth/committenti/[committente_id]/movimenti-simple": { committente_id: string };
			"/auth/committenti/[committente_id]/movimenti": { committente_id: string };
			"/auth/committenti/[committente_id]/movimenti/debug": { committente_id: string };
			"/auth/committenti/[committente_id]/prodotti": { committente_id: string };
			"/auth/committenti/[committente_id]/super-simple": { committente_id: string };
			"/auth/committenti/[committente_id]/test-js": { committente_id: string };
			"/auth/committenti/[committente_id]/unita-misura": { committente_id: string };
			"/auth/dashboard": Record<string, never>;
			"/auth/giacenze": Record<string, never>;
			"/auth/login": Record<string, never>;
			"/auth/movimenti": Record<string, never>;
			"/auth/ordini": { id?: string };
			"/auth/ordini/nuovo": Record<string, never>;
			"/auth/ordini/[id]": { id: string };
			"/auth/ottimizzazione": Record<string, never>;
			"/auth/prodotti": Record<string, never>;
			"/auth/wave-planning": Record<string, never>;
			"/test-css": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/admin" | "/api/admin/" | "/api/admin/categorie" | "/api/admin/categorie/" | "/api/admin/categorie/copy" | "/api/admin/categorie/copy/" | "/api/admin/committenti" | "/api/admin/committenti/" | "/api/admin/committenti/check" | "/api/admin/committenti/check/" | "/api/admin/committenti/stats" | "/api/admin/committenti/stats/" | "/api/admin/committenti/with-stats" | "/api/admin/committenti/with-stats/" | `/api/admin/committenti/${string}` & {} | `/api/admin/committenti/${string}/` & {} | "/api/admin/fornitori" | "/api/admin/fornitori/" | "/api/admin/fornitori/check" | "/api/admin/fornitori/check/" | "/api/admin/fornitori/suggestions" | "/api/admin/fornitori/suggestions/" | `/api/admin/fornitori/${string}` & {} | `/api/admin/fornitori/${string}/` & {} | "/api/admin/prodotti" | "/api/admin/prodotti/" | "/api/admin/prodotti/copy" | "/api/admin/prodotti/copy/" | "/api/admin/unita-misura" | "/api/admin/unita-misura/" | "/api/admin/unita-misura/init" | "/api/admin/unita-misura/init/" | "/api/committenti" | "/api/committenti/" | `/api/committenti/${string}` & {} | `/api/committenti/${string}/` & {} | `/api/committenti/${string}/categorie` & {} | `/api/committenti/${string}/categorie/` & {} | `/api/committenti/${string}/categorie/check` & {} | `/api/committenti/${string}/categorie/check/` & {} | `/api/committenti/${string}/categorie/${string}` & {} | `/api/committenti/${string}/categorie/${string}/` & {} | `/api/committenti/${string}/fornitori` & {} | `/api/committenti/${string}/fornitori/` & {} | `/api/committenti/${string}/fornitori/associate` & {} | `/api/committenti/${string}/fornitori/associate/` & {} | `/api/committenti/${string}/fornitori/${string}` & {} | `/api/committenti/${string}/fornitori/${string}/` & {} | `/api/committenti/${string}/giacenze` & {} | `/api/committenti/${string}/giacenze/` & {} | `/api/committenti/${string}/giacenze/scorta-bassa` & {} | `/api/committenti/${string}/giacenze/scorta-bassa/` & {} | `/api/committenti/${string}/giacenze/${string}` & {} | `/api/committenti/${string}/giacenze/${string}/` & {} | `/api/committenti/${string}/inventari` & {} | `/api/committenti/${string}/inventari/` & {} | `/api/committenti/${string}/inventari/${string}` & {} | `/api/committenti/${string}/inventari/${string}/` & {} | `/api/committenti/${string}/inventari/${string}/actions` & {} | `/api/committenti/${string}/inventari/${string}/actions/` & {} | `/api/committenti/${string}/inventari/${string}/conteggi` & {} | `/api/committenti/${string}/inventari/${string}/conteggi/` & {} | `/api/committenti/${string}/inventari/${string}/conteggi/${string}` & {} | `/api/committenti/${string}/inventari/${string}/conteggi/${string}/` & {} | `/api/committenti/${string}/movimenti` & {} | `/api/committenti/${string}/movimenti/` & {} | `/api/committenti/${string}/movimenti/dropdown-data` & {} | `/api/committenti/${string}/movimenti/dropdown-data/` & {} | `/api/committenti/${string}/movimenti/${string}` & {} | `/api/committenti/${string}/movimenti/${string}/` & {} | `/api/committenti/${string}/prodotti` & {} | `/api/committenti/${string}/prodotti/` & {} | `/api/committenti/${string}/prodotti/check` & {} | `/api/committenti/${string}/prodotti/check/` & {} | `/api/committenti/${string}/prodotti/scorte-basse` & {} | `/api/committenti/${string}/prodotti/scorte-basse/` & {} | `/api/committenti/${string}/prodotti/suggestions` & {} | `/api/committenti/${string}/prodotti/suggestions/` & {} | `/api/committenti/${string}/prodotti/${string}` & {} | `/api/committenti/${string}/prodotti/${string}/` & {} | `/api/committenti/${string}/unita-misura` & {} | `/api/committenti/${string}/unita-misura/` & {} | `/api/committenti/${string}/unita-misura/check` & {} | `/api/committenti/${string}/unita-misura/check/` & {} | `/api/committenti/${string}/unita-misura/suggestions` & {} | `/api/committenti/${string}/unita-misura/suggestions/` & {} | `/api/committenti/${string}/unita-misura/${string}` & {} | `/api/committenti/${string}/unita-misura/${string}/` & {} | "/api/fornitori" | "/api/fornitori/" | `/api/fornitori/${string}` & {} | `/api/fornitori/${string}/` & {} | `/api/fornitori/${string}/prodotti` & {} | `/api/fornitori/${string}/prodotti/` & {} | "/api/giacenze" | "/api/giacenze/" | "/api/giacenze/global" | "/api/giacenze/global/" | "/api/movimenti" | "/api/movimenti/" | "/api/movimenti/global" | "/api/movimenti/global/" | "/api/prodotti" | "/api/prodotti/" | "/api/prodotti/global" | "/api/prodotti/global/" | "/auth" | "/auth/" | "/auth/admin" | "/auth/admin/" | "/auth/admin/committenti" | "/auth/admin/committenti/" | "/auth/committenti" | "/auth/committenti/" | `/auth/committenti/${string}` & {} | `/auth/committenti/${string}/` & {} | `/auth/committenti/${string}/categorie` & {} | `/auth/committenti/${string}/categorie/` & {} | `/auth/committenti/${string}/fornitori` & {} | `/auth/committenti/${string}/fornitori/` & {} | `/auth/committenti/${string}/giacenze` & {} | `/auth/committenti/${string}/giacenze/` & {} | `/auth/committenti/${string}/giacenze/scorta-bassa` & {} | `/auth/committenti/${string}/giacenze/scorta-bassa/` & {} | `/auth/committenti/${string}/inventari` & {} | `/auth/committenti/${string}/inventari/` & {} | `/auth/committenti/${string}/inventari/${string}` & {} | `/auth/committenti/${string}/inventari/${string}/` & {} | `/auth/committenti/${string}/magazzino` & {} | `/auth/committenti/${string}/magazzino/` & {} | `/auth/committenti/${string}/movimenti-simple` & {} | `/auth/committenti/${string}/movimenti-simple/` & {} | `/auth/committenti/${string}/movimenti` & {} | `/auth/committenti/${string}/movimenti/` & {} | `/auth/committenti/${string}/movimenti/debug` & {} | `/auth/committenti/${string}/movimenti/debug/` & {} | `/auth/committenti/${string}/prodotti` & {} | `/auth/committenti/${string}/prodotti/` & {} | `/auth/committenti/${string}/super-simple` & {} | `/auth/committenti/${string}/super-simple/` & {} | `/auth/committenti/${string}/test-js` & {} | `/auth/committenti/${string}/test-js/` & {} | `/auth/committenti/${string}/unita-misura` & {} | `/auth/committenti/${string}/unita-misura/` & {} | "/auth/dashboard" | "/auth/dashboard/" | "/auth/giacenze" | "/auth/giacenze/" | "/auth/login" | "/auth/login/" | "/auth/movimenti" | "/auth/movimenti/" | "/auth/ordini" | "/auth/ordini/" | "/auth/ordini/nuovo" | "/auth/ordini/nuovo/" | `/auth/ordini/${string}` & {} | `/auth/ordini/${string}/` & {} | "/auth/ottimizzazione" | "/auth/ottimizzazione/" | "/auth/prodotti" | "/auth/prodotti/" | "/auth/wave-planning" | "/auth/wave-planning/" | "/test-css" | "/test-css/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/favicon.png" | string & {};
	}
}