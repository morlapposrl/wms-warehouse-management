
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const SMTP_SERVER: string;
	export const SMTP_PORT: string;
	export const SMTP_USERNAME: string;
	export const SMTP_PASSWORD: string;
	export const FROM_EMAIL: string;
	export const NODE_ENV: string;
	export const LESSOPEN: string;
	export const pm_out_log_path: string;
	export const LANGUAGE: string;
	export const USER: string;
	export const SSH_CLIENT: string;
	export const npm_config_user_agent: string;
	export const restart_time: string;
	export const XDG_SESSION_TYPE: string;
	export const BUN_INSTALL: string;
	export const npm_node_execpath: string;
	export const PM2_USAGE: string;
	export const SHLVL: string;
	export const npm_config_noproxy: string;
	export const MOTD_SHOWN: string;
	export const HOME: string;
	export const username: string;
	export const OLDPWD: string;
	export const PM2_HOME: string;
	export const created_at: string;
	export const NVM_BIN: string;
	export const SSH_TTY: string;
	export const npm_package_json: string;
	export const NVM_INC: string;
	export const pm_cwd: string;
	export const namespace: string;
	export const npm_config_userconfig: string;
	export const npm_config_local_prefix: string;
	export const filter_env: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const pm_exec_path: string;
	export const unstable_restarts: string;
	export const pm_id: string;
	export const kill_retry_time: string;
	export const COLOR: string;
	export const NVM_DIR: string;
	export const LOGNAME: string;
	export const node_args: string;
	export const versioning: string;
	export const autostart: string;
	export const _: string;
	export const npm_config_prefix: string;
	export const npm_config_npm_version: string;
	export const XDG_SESSION_CLASS: string;
	export const TERM: string;
	export const XDG_SESSION_ID: string;
	export const exec_mode: string;
	export const npm_config_cache: string;
	export const NODE_APP_INSTANCE: string;
	export const axm_monitor: string;
	export const windowsHide: string;
	export const status: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const exec_interpreter: string;
	export const watch: string;
	export const NODE: string;
	export const npm_package_name: string;
	export const prev_restart_delay: string;
	export const XDG_RUNTIME_DIR: string;
	export const axm_options: string;
	export const axm_dynamic: string;
	export const LANG: string;
	export const DOTNET_BUNDLE_EXTRACT_BASE_DIR: string;
	export const vizion: string;
	export const pm_pid_path: string;
	export const pm_err_log_path: string;
	export const treekill: string;
	export const LS_COLORS: string;
	export const npm_lifecycle_script: string;
	export const SHELL: string;
	export const pmx: string;
	export const unique_id: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const automation: string;
	export const exit_code: string;
	export const LESSCLOSE: string;
	export const vizion_running: string;
	export const instance_var: string;
	export const name: string;
	export const npm_config_globalconfig: string;
	export const npm_config_init_module: string;
	export const PWD: string;
	export const npm_execpath: string;
	export const env: string;
	export const SSH_CONNECTION: string;
	export const NVM_CD_FLAGS: string;
	export const npm_config_global_prefix: string;
	export const km_link: string;
	export const instances: string;
	export const axm_actions: string;
	export const merge_logs: string;
	export const npm_command: string;
	export const autorestart: string;
	export const pm_uptime: string;
	export const INIT_CWD: string;
	export const EDITOR: string;
	export const VITE_USER_NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	export const PUBLIC_URL: string;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		SMTP_SERVER: string;
		SMTP_PORT: string;
		SMTP_USERNAME: string;
		SMTP_PASSWORD: string;
		FROM_EMAIL: string;
		NODE_ENV: string;
		LESSOPEN: string;
		pm_out_log_path: string;
		LANGUAGE: string;
		USER: string;
		SSH_CLIENT: string;
		npm_config_user_agent: string;
		restart_time: string;
		XDG_SESSION_TYPE: string;
		BUN_INSTALL: string;
		npm_node_execpath: string;
		PM2_USAGE: string;
		SHLVL: string;
		npm_config_noproxy: string;
		MOTD_SHOWN: string;
		HOME: string;
		username: string;
		OLDPWD: string;
		PM2_HOME: string;
		created_at: string;
		NVM_BIN: string;
		SSH_TTY: string;
		npm_package_json: string;
		NVM_INC: string;
		pm_cwd: string;
		namespace: string;
		npm_config_userconfig: string;
		npm_config_local_prefix: string;
		filter_env: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		pm_exec_path: string;
		unstable_restarts: string;
		pm_id: string;
		kill_retry_time: string;
		COLOR: string;
		NVM_DIR: string;
		LOGNAME: string;
		node_args: string;
		versioning: string;
		autostart: string;
		_: string;
		npm_config_prefix: string;
		npm_config_npm_version: string;
		XDG_SESSION_CLASS: string;
		TERM: string;
		XDG_SESSION_ID: string;
		exec_mode: string;
		npm_config_cache: string;
		NODE_APP_INSTANCE: string;
		axm_monitor: string;
		windowsHide: string;
		status: string;
		npm_config_node_gyp: string;
		PATH: string;
		exec_interpreter: string;
		watch: string;
		NODE: string;
		npm_package_name: string;
		prev_restart_delay: string;
		XDG_RUNTIME_DIR: string;
		axm_options: string;
		axm_dynamic: string;
		LANG: string;
		DOTNET_BUNDLE_EXTRACT_BASE_DIR: string;
		vizion: string;
		pm_pid_path: string;
		pm_err_log_path: string;
		treekill: string;
		LS_COLORS: string;
		npm_lifecycle_script: string;
		SHELL: string;
		pmx: string;
		unique_id: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		automation: string;
		exit_code: string;
		LESSCLOSE: string;
		vizion_running: string;
		instance_var: string;
		name: string;
		npm_config_globalconfig: string;
		npm_config_init_module: string;
		PWD: string;
		npm_execpath: string;
		env: string;
		SSH_CONNECTION: string;
		NVM_CD_FLAGS: string;
		npm_config_global_prefix: string;
		km_link: string;
		instances: string;
		axm_actions: string;
		merge_logs: string;
		npm_command: string;
		autorestart: string;
		pm_uptime: string;
		INIT_CWD: string;
		EDITOR: string;
		VITE_USER_NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_URL: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
