/** @file src/routes/api/user/confirm-email/+server.ts
 * Verifies a signed email-change token and updates the user's email address.
 * Called via the link sent by /app/settings (requestEmailChange action).
 */
import { redirect } from '@sveltejs/kit';
import { AUTH_SECRET } from '$env/static/private';
import { serverRequest } from '$lib/graphql/server-client';
import jwt from 'jsonwebtoken';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		redirect(302, '/app/settings?email_change=invalid');
	}

	let payload: { userId: string; newEmail: string };
	try {
		payload = jwt.verify(token, AUTH_SECRET) as { userId: string; newEmail: string };
	} catch {
		redirect(302, '/app/settings?email_change=expired');
	}

	// Check new email not already taken
	const check = await serverRequest<{ users: { id: string }[] }>(
		`query CheckEmail($email: String!) { users(where: { email: { _eq: $email } }, limit: 1) { id } }`,
		{ email: payload.newEmail }
	);
	if (check.users.length > 0) {
		redirect(302, '/app/settings?email_change=taken');
	}

	await serverRequest(
		`mutation UpdateEmail($id: uuid!, $email: String!) {
      update_users_by_pk(pk_columns: { id: $id }, _set: { email: $email, updated_at: "now()" }) { id }
    }`,
		{ id: payload.userId, email: payload.newEmail }
	);

	redirect(302, '/app/settings?email_change=success');
};
