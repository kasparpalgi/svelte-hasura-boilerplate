/** @file src/routes/+layout.server.ts */
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return { session: await locals.auth() };
};
