/** @file src/routes/app/settings/+page.server.ts */
import { fail } from '@sveltejs/kit';
import { AUTH_SECRET } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { serverRequest } from '$lib/graphql/server-client';
import { hashPassword, verifyPassword } from '$lib/server/password';
import { sendMail } from '$lib/server/mailer';
import { passwordSchema } from '$lib/schemas/auth';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	const userId = session?.user?.id;
	if (!userId) return { passkeys: [] };

	const data = await serverRequest<{
		authenticators: {
			credentialID: string;
			credentialDeviceType: string;
			credentialBackedUp: boolean;
			transports: string | null;
		}[];
	}>(
		`query ListPasskeys($userId: uuid!) {
      authenticators(where: { userId: { _eq: $userId } }) {
        credentialID credentialDeviceType credentialBackedUp transports
      }
    }`,
		{ userId }
	);

	return { passkeys: data.authenticators };
};

export const actions: Actions = {
	updateName: async ({ request, locals }) => {
		const session = await locals.auth();
		const userId = session?.user?.id;
		if (!userId) return fail(401, { error: 'Not authenticated' });

		const form = await request.formData();
		const name = form.get('name')?.toString().trim();

		const parsed = z.string().min(1).max(100).safeParse(name);
		if (!parsed.success) return fail(400, { field: 'name', error: 'Name must be 1–100 characters' });

		await serverRequest(
			`mutation UpdateName($id: uuid!, $name: String!) {
        update_users_by_pk(pk_columns: { id: $id }, _set: { name: $name, updated_at: "now()" }) { id }
      }`,
			{ id: userId, name: parsed.data }
		);

		return { success: true, action: 'updateName' };
	},

	changePassword: async ({ request, locals }) => {
		const session = await locals.auth();
		const userId = session?.user?.id;
		if (!userId) return fail(401, { error: 'Not authenticated' });

		const form = await request.formData();
		const currentPassword = form.get('currentPassword')?.toString() ?? '';
		const newPassword = form.get('newPassword')?.toString() ?? '';
		const confirmPassword = form.get('confirmPassword')?.toString() ?? '';

		if (newPassword !== confirmPassword) {
			return fail(400, { field: 'confirmPassword', error: 'Passwords do not match' });
		}

		const parsed = passwordSchema.safeParse(newPassword);
		if (!parsed.success) {
			return fail(400, { field: 'newPassword', error: parsed.error.issues[0].message });
		}

		// Fetch current hashed password
		const found = await serverRequest<{ users_by_pk: { password: string | null } | null }>(
			`query GetPassword($id: uuid!) { users_by_pk(id: $id) { password } }`,
			{ id: userId }
		);
		const user = found.users_by_pk;
		if (!user?.password) {
			return fail(400, { field: 'currentPassword', error: 'No password set — use Google or passkey to sign in' });
		}

		const valid = await verifyPassword(currentPassword, user.password);
		if (!valid) return fail(400, { field: 'currentPassword', error: 'Current password is incorrect' });

		const hashed = await hashPassword(newPassword);
		await serverRequest(
			`mutation UpdatePassword($id: uuid!, $password: String!) {
        update_users_by_pk(pk_columns: { id: $id }, _set: { password: $password, updated_at: "now()" }) { id }
      }`,
			{ id: userId, password: hashed }
		);

		return { success: true, action: 'changePassword' };
	},

	requestEmailChange: async ({ request, locals, url }) => {
		const session = await locals.auth();
		const userId = session?.user?.id;
		if (!userId) return fail(401, { error: 'Not authenticated' });

		if (!env.EMAIL_SERVER_HOST) {
			return fail(503, { field: 'email', error: 'Email sending is not configured on this server' });
		}

		const form = await request.formData();
		const newEmail = form.get('newEmail')?.toString().trim().toLowerCase();

		const parsed = z.string().email().safeParse(newEmail);
		if (!parsed.success) return fail(400, { field: 'email', error: 'Enter a valid email address' });

		// Check not already in use
		const check = await serverRequest<{ users: { id: string }[] }>(
			`query CheckEmail($email: String!) { users(where: { email: { _eq: $email } }, limit: 1) { id } }`,
			{ email: parsed.data }
		);
		if (check.users.length > 0) {
			return fail(400, { field: 'email', error: 'That email is already in use' });
		}

		const token = jwt.sign({ userId, newEmail: parsed.data }, AUTH_SECRET, { expiresIn: '1h' });
		const confirmUrl = `${url.origin}/api/user/confirm-email?token=${token}`;

		await sendMail({
			to: parsed.data,
			subject: 'Confirm your email change',
			html: `
				<p>You requested to change your email address.</p>
				<p><a href="${confirmUrl}">Click here to confirm your new email</a></p>
				<p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
			`
		});

		return { success: true, action: 'requestEmailChange' };
	},

	deletePasskey: async ({ request, locals }) => {
		const session = await locals.auth();
		const userId = session?.user?.id;
		if (!userId) return fail(401, { error: 'Not authenticated' });

		const form = await request.formData();
		const credentialID = form.get('credentialID')?.toString();
		if (!credentialID) return fail(400, { error: 'Missing credentialID' });

		// Delete only if it belongs to this user
		await serverRequest(
			`mutation DeletePasskey($credentialID: String!, $userId: uuid!) {
        delete_authenticators(where: { credentialID: { _eq: $credentialID }, userId: { _eq: $userId } }) { affected_rows }
      }`,
			{ credentialID, userId }
		);

		return { success: true, action: 'deletePasskey' };
	}
};
