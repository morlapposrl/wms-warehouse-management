import type * as Kit from '@sveltejs/kit';

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
// @ts-ignore
type MatcherParam<M> = M extends (param : string) => param is infer U ? U extends string ? U : string : string;
type RouteParams = {  };
type RouteId = '/auth';
type MaybeWithVoid<T> = {} extends T ? T | void : T;
export type RequiredKeys<T> = { [K in keyof T]-?: {} extends { [P in K]: T[K] } ? never : K; }[keyof T];
type OutputDataShape<T> = MaybeWithVoid<Omit<App.PageData, RequiredKeys<T>> & Partial<Pick<App.PageData, keyof T & keyof App.PageData>> & Record<string, any>>
type EnsureDefined<T> = T extends null | undefined ? {} : T;
type OptionalUnion<U extends Record<string, any>, A extends keyof U = U extends U ? keyof U : never> = U extends unknown ? { [P in Exclude<A, keyof U>]?: never } & U : never;
export type Snapshot<T = any> = Kit.Snapshot<T>;
type PageParentData = Omit<EnsureDefined<import('../$types.js').LayoutData>, keyof LayoutData> & EnsureDefined<LayoutData>;
type LayoutRouteId = RouteId | "/auth" | "/auth/admin/committenti" | "/auth/admin/committenti/[id]/modifica" | "/auth/audit" | "/auth/categorie" | "/auth/causali" | "/auth/dashboard" | "/auth/dashboard-compact" | "/auth/fornitori" | "/auth/giacenze" | "/auth/magazzini" | "/auth/magazzino" | "/auth/movimenti" | "/auth/movimenti/nuovo" | "/auth/ordini" | "/auth/ordini/[id]" | "/auth/ordini/nuovo" | "/auth/ottimizzazione" | "/auth/prodotti" | "/auth/sistema" | "/auth/tipi-udc" | "/auth/udc" | "/auth/udc/[id]" | "/auth/unita-misura" | "/auth/utenti" | "/auth/wave-planning" | "/auth/wave-planning/[id]"
type LayoutParams = RouteParams & { id?: string }
type LayoutParentData = EnsureDefined<import('../$types.js').LayoutData>;

export type PageServerData = null;
export type PageData = Expand<PageParentData>;
export type PageProps = { params: RouteParams; data: PageData }
export type LayoutServerData = null;
export type LayoutData = Expand<LayoutParentData>;
export type LayoutProps = { params: LayoutParams; data: LayoutData; children: import("svelte").Snippet }