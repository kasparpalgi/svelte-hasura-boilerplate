/** @file src/lib/server/auth-adapter.ts
 * Wraps HasuraAdapter with the WebAuthn adapter methods required for Passkeys.
 * The base adapter covers all standard Auth.js operations; this file adds
 * getAccount, getAuthenticator, createAuthenticator, listAuthenticatorsByUserId,
 * and updateAuthenticatorCounter against our `authenticators` table.
 */
import { HasuraAdapter } from '@auth/hasura-adapter';
import { serverRequest } from '$lib/graphql/server-client';
import type { AdapterAuthenticator, AdapterAccount } from '@auth/core/adapters';

type HasuraAdapterOptions = Parameters<typeof HasuraAdapter>[0];

export function createAdapter(options: HasuraAdapterOptions) {
	const base = HasuraAdapter(options);

	return {
		...base,

		async getAccount(
			providerAccountId: AdapterAccount['providerAccountId'],
			provider: AdapterAccount['provider']
		): Promise<AdapterAccount | null> {
			const data = await serverRequest<{
				accounts: AdapterAccount[];
			}>(
				`query GetAccount($providerAccountId: String!, $provider: String!) {
          accounts(where: { providerAccountId: { _eq: $providerAccountId }, provider: { _eq: $provider } }, limit: 1) {
            id type provider providerAccountId refresh_token access_token expires_at token_type scope id_token session_state userId
          }
        }`,
				{ providerAccountId, provider }
			);
			return data.accounts[0] ?? null;
		},

		async getAuthenticator(credentialID: string): Promise<AdapterAuthenticator | null> {
			const data = await serverRequest<{
				authenticators: AdapterAuthenticator[];
			}>(
				`query GetAuthenticator($credentialID: String!) {
          authenticators(where: { credentialID: { _eq: $credentialID } }, limit: 1) {
            credentialID userId providerAccountId credentialPublicKey counter credentialDeviceType credentialBackedUp transports
          }
        }`,
				{ credentialID }
			);
			return data.authenticators[0] ?? null;
		},

		async createAuthenticator(authenticator: AdapterAuthenticator): Promise<AdapterAuthenticator> {
			const data = await serverRequest<{
				insert_authenticators_one: AdapterAuthenticator;
			}>(
				`mutation CreateAuthenticator(
          $credentialID: String!
          $userId: uuid!
          $providerAccountId: String!
          $credentialPublicKey: String!
          $counter: Int!
          $credentialDeviceType: String!
          $credentialBackedUp: Boolean!
          $transports: String
        ) {
          insert_authenticators_one(object: {
            credentialID: $credentialID
            userId: $userId
            providerAccountId: $providerAccountId
            credentialPublicKey: $credentialPublicKey
            counter: $counter
            credentialDeviceType: $credentialDeviceType
            credentialBackedUp: $credentialBackedUp
            transports: $transports
          }) {
            credentialID userId providerAccountId credentialPublicKey counter credentialDeviceType credentialBackedUp transports
          }
        }`,
				authenticator
			);
			return data.insert_authenticators_one;
		},

		async listAuthenticatorsByUserId(userId: string): Promise<AdapterAuthenticator[]> {
			const data = await serverRequest<{
				authenticators: AdapterAuthenticator[];
			}>(
				`query ListAuthenticators($userId: uuid!) {
          authenticators(where: { userId: { _eq: $userId } }) {
            credentialID userId providerAccountId credentialPublicKey counter credentialDeviceType credentialBackedUp transports
          }
        }`,
				{ userId }
			);
			return data.authenticators;
		},

		async updateAuthenticatorCounter(
			credentialID: string,
			newCounter: number
		): Promise<AdapterAuthenticator> {
			const data = await serverRequest<{
				update_authenticators_by_pk: AdapterAuthenticator;
			}>(
				`mutation UpdateAuthenticatorCounter($credentialID: String!, $counter: Int!) {
          update_authenticators_by_pk(pk_columns: { credentialID: $credentialID }, _set: { counter: $counter }) {
            credentialID userId providerAccountId credentialPublicKey counter credentialDeviceType credentialBackedUp transports
          }
        }`,
				{ credentialID, counter: newCounter }
			);
			return data.update_authenticators_by_pk;
		}
	};
}
