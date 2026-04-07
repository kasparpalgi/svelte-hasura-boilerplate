// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import '@auth/sveltekit';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: import('@auth/sveltekit').SvelteKitAuthConfig['callbacks'] extends {
				session: infer S;
			}
				? S
				: never;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '@auth/core/types' {
	interface Session {
		hasuraRole?: string;
	}
}

export {};
