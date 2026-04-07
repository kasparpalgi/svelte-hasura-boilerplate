/** @file src/routes/signout/+server.ts */
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const auth = locals.auth as unknown as { signOut: () => Promise<void> };
	await auth.signOut();
	throw redirect(302, '/signin');
};
