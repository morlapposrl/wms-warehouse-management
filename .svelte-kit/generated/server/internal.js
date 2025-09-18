
import root from '../root.js';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	csrf_trusted_origins: [],
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	service_worker_options: undefined,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!DOCTYPE html>\n<html lang=\"%lang%\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"https://connect.microlops.it:3304/morlappo-logo-white.png\" />\n\t\t<link rel=\"apple-touch-icon\" href=\"https://connect.microlops.it:3304/morlappo-logo-white.png\" />\n\t\t<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n\t\t<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap\" rel=\"stylesheet\">\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t<meta name=\"description\" content=\"AI-powered multilingual WMS for Europe. Smart warehouse management system with artificial intelligence for multi-client logistics. Italia, France, Germany, Spain - Sistema magazzino intelligente multilingua.\" />\n\t\t<meta name=\"author\" content=\"Morlappo Srl - Innovazione attraverso l'Intelligenza Artificiale\" />\n\t\t<meta name=\"keywords\" content=\"WMS, warehouse management system, magazzino, logistics, AI, artificial intelligence, intelligenza artificiale, gestionale, multicommittente, multi-client, Morlappo, 3PL, logistica 4.0, automazione magazzino, gestionale cloud, SaaS logistica, Italia, Europe, Europa, multilingual, multilingua, smart warehouse, magazzino intelligente, inventory management, gestione inventario, supply chain, catena fornitura, machine learning, IoT warehouse, magazzino IoT, digital transformation, trasformazione digitale, Industry 4.0, Industria 4.0\" />\n\t\t<meta property=\"og:title\" content=\"AI-Powered WMS for Europe | Morlappo Smart Warehouse\" />\n\t\t<meta property=\"og:description\" content=\"AI-powered multilingual WMS for Europe. Smart warehouse management system with artificial intelligence for multi-client logistics across Italia, France, Germany, Spain.\" />\n\t\t<meta property=\"og:type\" content=\"website\" />\n\t\t<meta property=\"og:image\" content=\"https://connect.microlops.it:3304/morlappo-logo-white.png\" />\n\t\t<meta property=\"og:url\" content=\"https://connect.microlops.it:3304\" />\n\t\t<meta property=\"og:site_name\" content=\"Morlappo WMS\" />\n\t\t<meta name=\"twitter:card\" content=\"summary_large_image\" />\n\t\t<meta name=\"twitter:title\" content=\"AI-Powered WMS for Europe | Morlappo Smart Warehouse\" />\n\t\t<meta name=\"twitter:description\" content=\"AI-powered multilingual WMS for Europe. Smart warehouse management system with artificial intelligence for multi-client logistics across Italia, France, Germany, Spain.\" />\n\t\t<meta name=\"twitter:image\" content=\"https://connect.microlops.it:3304/morlappo-logo-white.png\" />\n\t\t<meta name=\"robots\" content=\"index, follow\" />\n\t\t<meta name=\"language\" content=\"IT\" />\n\t\t<meta name=\"revisit-after\" content=\"7 days\" />\n\t\t<link rel=\"canonical\" href=\"https://connect.microlops.it:3304\" />\n\t\t<meta name=\"discord\" content=\"https://canary.discord.com/channels/1417092442569572364/1417092781398032446\" />\n\t\t<meta name=\"support\" content=\"Discord Community Support\" />\n\t\t<title>AI-Powered WMS for Europe | Smart Warehouse Management | Morlappo</title>\n\t\t" + head + "\n\t</head>\n\t<body data-sveltekit-preload-data=\"hover\">\n\t\t<div style=\"display: contents\">" + body + "</div>\n\t</body>\n</html>",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "1ejh1cv"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let handleValidationError;
	let init;
	({ handle, handleFetch, handleError, handleValidationError, init } = await import("../../../src/hooks.server.ts"));

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		handleValidationError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation };
