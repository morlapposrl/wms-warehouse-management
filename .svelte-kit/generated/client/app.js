export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34')
];

export const server_loads = [0];

export const dictionary = {
		"/": [3],
		"/auth": [4,[2]],
		"/auth/admin/committenti": [~5,[2]],
		"/auth/admin/committenti/[id]/modifica": [~6,[2]],
		"/auth/audit": [~7,[2]],
		"/auth/categorie": [8,[2]],
		"/auth/causali": [9,[2]],
		"/auth/dashboard-compact": [~11,[2]],
		"/auth/dashboard": [~10,[2]],
		"/auth/fornitori": [12,[2]],
		"/auth/giacenze": [~13,[2]],
		"/auth/magazzini": [14,[2]],
		"/auth/magazzino": [~15,[2]],
		"/auth/movimenti": [~16,[2]],
		"/auth/movimenti/nuovo": [~17,[2]],
		"/auth/ordini": [~18,[2]],
		"/auth/ordini/nuovo": [~20,[2]],
		"/auth/ordini/[id]": [~19,[2]],
		"/auth/ottimizzazione": [~21,[2]],
		"/auth/prodotti": [22,[2]],
		"/auth/sistema": [23,[2]],
		"/auth/tipi-udc": [~24,[2]],
		"/auth/transfer": [25,[2]],
		"/auth/udc": [~26,[2]],
		"/auth/udc/[id]": [~27,[2]],
		"/auth/unita-misura": [28,[2]],
		"/auth/utenti": [~29,[2]],
		"/auth/wave-planning": [~30,[2]],
		"/auth/wave-planning/[id]": [~31,[2]],
		"/login": [~32],
		"/logs": [33],
		"/test-css": [34]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';