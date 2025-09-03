import type * as Kit from '@sveltejs/kit';

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
// @ts-ignore
type MatcherParam<M> = M extends (param : string) => param is infer U ? U extends string ? U : string : string;
type RouteParams = {  };
type RouteId = '/';
type MaybeWithVoid<T> = {} extends T ? T | void : T;
export type RequiredKeys<T> = { [K in keyof T]-?: {} extends { [P in K]: T[K] } ? never : K; }[keyof T];
type OutputDataShape<T> = MaybeWithVoid<Omit<App.PageData, RequiredKeys<T>> & Partial<Pick<App.PageData, keyof T & keyof App.PageData>> & Record<string, any>>
type EnsureDefined<T> = T extends null | undefined ? {} : T;
type OptionalUnion<U extends Record<string, any>, A extends keyof U = U extends U ? keyof U : never> = U extends unknown ? { [P in Exclude<A, keyof U>]?: never } & U : never;
export type Snapshot<T = any> = Kit.Snapshot<T>;
type PageParentData = EnsureDefined<LayoutData>;
type LayoutRouteId = RouteId | "/" | "/auth" | "/auth/admin/committenti" | "/auth/committenti" | "/auth/committenti/[committente_id]" | "/auth/committenti/[committente_id]/categorie" | "/auth/committenti/[committente_id]/fornitori" | "/auth/committenti/[committente_id]/giacenze" | "/auth/committenti/[committente_id]/giacenze/scorta-bassa" | "/auth/committenti/[committente_id]/inventari" | "/auth/committenti/[committente_id]/inventari/[inventario_id]" | "/auth/committenti/[committente_id]/magazzino" | "/auth/committenti/[committente_id]/movimenti" | "/auth/committenti/[committente_id]/movimenti/debug" | "/auth/committenti/[committente_id]/movimenti-simple" | "/auth/committenti/[committente_id]/prodotti" | "/auth/committenti/[committente_id]/super-simple" | "/auth/committenti/[committente_id]/test-js" | "/auth/committenti/[committente_id]/unita-misura" | "/auth/dashboard" | "/auth/giacenze" | "/auth/magazzino" | "/auth/movimenti" | "/auth/movimenti/nuovo" | "/auth/ordini" | "/auth/ordini/[id]" | "/auth/ordini/nuovo" | "/auth/ottimizzazione" | "/auth/prodotti" | "/auth/wave-planning" | "/test-css" | null
type LayoutParams = RouteParams & { committente_id?: string; inventario_id?: string; id?: string }
type LayoutParentData = EnsureDefined<{}>;

export type PageServerData = null;
export type PageData = Expand<PageParentData>;
export type PageProps = { params: RouteParams; data: PageData }
export type LayoutServerData = null;
export type LayoutData = Expand<LayoutParentData>;
export type LayoutProps = { params: LayoutParams; data: LayoutData; children: import("svelte").Snippet }