/** @file src/lib/graphql/server-client.ts — server-side only, uses admin secret */
import { API_ENDPOINT, API_ENDPOINT_DEV, HASURA_ADMIN_SECRET } from '$env/static/private';
import { PUBLIC_API_ENV } from '$env/static/public';
import { GraphQLClient } from 'graphql-request';

const apiEndpoint = PUBLIC_API_ENV === 'production' ? API_ENDPOINT : API_ENDPOINT_DEV;
const client = new GraphQLClient(apiEndpoint, {
	headers: { 'x-hasura-admin-secret': HASURA_ADMIN_SECRET }
});

export async function serverRequest<TResult, TVariables = unknown>(
	document: { toString(): string },
	variables?: TVariables
): Promise<TResult> {
	return client.request<TResult>(
		document.toString(),
		variables as Record<string, unknown>
	);
}
