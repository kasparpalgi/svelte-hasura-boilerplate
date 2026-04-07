/** @file src/hooks.server.ts */
import { SvelteKitAuth } from '@auth/sveltekit';
import { createAdapter } from '$lib/server/auth-adapter';
import Credentials from '@auth/sveltekit/providers/credentials';
import Passkey from '@auth/sveltekit/providers/passkey';
import { sequence } from '@sveltejs/kit/hooks';
import { AUTH_SECRET, API_ENDPOINT, API_ENDPOINT_DEV, HASURA_ADMIN_SECRET } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { PUBLIC_API_ENV } from '$env/static/public';
import { hashPassword, verifyPassword } from '$lib/server/password';
import { signupSchema, loginSchema } from '$lib/schemas/auth';
import { serverRequest } from '$lib/graphql/server-client';
import type { Handle } from '@sveltejs/kit';
import type { Provider } from '@auth/sveltekit/providers';

const apiEndpoint = PUBLIC_API_ENV === 'production' ? API_ENDPOINT : API_ENDPOINT_DEV;

const providers: Provider[] = [
	// Passkeys: Windows Hello, Touch ID, FaceID, fingerprint — no cloud setup needed
	Passkey,

	// Email + Password (always on)
	Credentials({
		id: 'credentials',
		name: 'Email and Password',
		credentials: {
			email: { type: 'email' },
			password: { type: 'password' },
			mode: { type: 'text' }, // 'login' | 'signup'
			name: { type: 'text' } // signup only
		},
		async authorize(credentials) {
			const { email, password, mode, name } = credentials as Record<string, string>;
			if (!email || !password) return null;

			if (mode === 'signup') {
				const parsed = signupSchema.safeParse({
					email,
					password,
					confirmPassword: password,
					name
				});
				if (!parsed.success) return null;

				const existing = await serverRequest<{ users: { id: string }[] }>(
					`query CheckEmail($email: String!) { users(where: { email: { _eq: $email } }, limit: 1) { id } }`,
					{ email }
				);
				if (existing.users.length > 0) return null;

				const hashed = await hashPassword(password);
				const created = await serverRequest<{
					insert_users_one: {
						id: string;
						name: string;
						email: string;
						image: string | null;
					};
				}>(
					`mutation CreateUser($email: String!, $name: String!, $password: String!) {
            insert_users_one(object: { email: $email, name: $name, password: $password }) {
              id name email image
            }
          }`,
					{ email, name, password: hashed }
				);
				const u = created.insert_users_one;
				return { id: u.id, name: u.name, email: u.email, image: u.image };
			}

			// Login
			const loginParsed = loginSchema.safeParse({ email, password });
			if (!loginParsed.success) return null;

			const found = await serverRequest<{
				users: {
					id: string;
					name: string;
					email: string;
					image: string | null;
					password: string | null;
				}[];
			}>(
				`query GetUser($email: String!) { users(where: { email: { _eq: $email } }, limit: 1) { id name email image password } }`,
				{ email }
			);
			const user = found.users[0];
			if (!user?.password) return null;
			if (!(await verifyPassword(password, user.password))) return null;

			return { id: user.id, name: user.name, email: user.email, image: user.image };
		}
	})
];

// Optional: Google OAuth (only added when env vars provided)
if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
	const { default: Google } = await import('@auth/sveltekit/providers/google');
	providers.push(Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }));
}

// Optional: Magic link via email (only added when env vars provided)
if (env.EMAIL_SERVER_HOST) {
	const { default: Nodemailer } = await import('@auth/sveltekit/providers/nodemailer');
	providers.push(
		Nodemailer({
			server: {
				host: env.EMAIL_SERVER_HOST,
				port: Number(env.EMAIL_SERVER_PORT ?? 587),
				auth: { user: env.EMAIL_SERVER_USER, pass: env.EMAIL_SERVER_PASSWORD }
			},
			from: env.EMAIL_FROM
		})
	);
}

export const { handle: authHandle } = SvelteKitAuth({
	adapter: createAdapter({ endpoint: apiEndpoint, adminSecret: HASURA_ADMIN_SECRET }),
	providers,
	secret: AUTH_SECRET,
	trustHost: true,
	experimental: { enableWebAuthn: true },
	pages: { signIn: '/signin' },
	session: { strategy: 'jwt', maxAge: 90 * 24 * 60 * 60 },
	callbacks: {
		jwt: ({ token, user }) => {
			if (user) {
				token.userId = user.id;
				token.hasuraRole = 'user';
			}
			return token;
		},
		session: ({ session, token }) => {
			if (token.userId) {
				session.user.id = token.userId as string;
				(session as { hasuraRole?: string }).hasuraRole = token.hasuraRole as string;
			}
			return session;
		}
	}
});

// Route guard
const securityHandle: Handle = async ({ event, resolve }) => {
	const session = await event.locals.auth();
	const path = event.url.pathname;

	const isAuthRoute = path.startsWith('/signin') || path.startsWith('/api/auth') || path.startsWith('/auth');
	const isProtected = path.startsWith('/app');

	// Redirect authenticated users away from sign-in page
	if (session && isAuthRoute) {
		return new Response(null, { status: 302, headers: { Location: '/app' } });
	}

	// Redirect unauthenticated users away from protected routes
	if (!session && isProtected) {
		return new Response(null, { status: 302, headers: { Location: '/signin' } });
	}

	return resolve(event);
};

export const handle = sequence(authHandle, securityHandle);
