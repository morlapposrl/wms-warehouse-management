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

export const server_loads = [];

export const dictionary = {
		"/": [4],
		"/auth": [5,[2]],
		"/auth/admin/committenti": [6,[2]],
		"/auth/committenti": [7,[2]],
		"/auth/committenti/[committente_id]": [~8,[2,3]],
		"/auth/committenti/[committente_id]/categorie": [9,[2,3]],
		"/auth/committenti/[committente_id]/fornitori": [10,[2,3]],
		"/auth/committenti/[committente_id]/giacenze": [11,[2,3]],
		"/auth/committenti/[committente_id]/giacenze/scorta-bassa": [12,[2,3]],
		"/auth/committenti/[committente_id]/inventari": [13,[2,3]],
		"/auth/committenti/[committente_id]/inventari/[inventario_id]": [14,[2,3]],
		"/auth/committenti/[committente_id]/magazzino": [~15,[2,3]],
		"/auth/committenti/[committente_id]/movimenti-simple": [18,[2,3]],
		"/auth/committenti/[committente_id]/movimenti": [16,[2,3]],
		"/auth/committenti/[committente_id]/movimenti/debug": [17,[2,3]],
		"/auth/committenti/[committente_id]/prodotti": [19,[2,3]],
		"/auth/committenti/[committente_id]/super-simple": [20,[2,3]],
		"/auth/committenti/[committente_id]/test-js": [21,[2,3]],
		"/auth/committenti/[committente_id]/unita-misura": [22,[2,3]],
		"/auth/dashboard": [~23,[2]],
		"/auth/giacenze": [~24,[2]],
		"/auth/magazzino": [~25,[2]],
		"/auth/movimenti": [~26,[2]],
		"/auth/movimenti/nuovo": [~27,[2]],
		"/auth/ordini": [~28,[2]],
		"/auth/ordini/nuovo": [~30,[2]],
		"/auth/ordini/[id]": [~29,[2]],
		"/auth/ottimizzazione": [~31,[2]],
		"/auth/prodotti": [32,[2]],
		"/auth/wave-planning": [~33,[2]],
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