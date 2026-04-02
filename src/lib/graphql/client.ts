/** @file src/lib/graphql/client.ts */
import { PUBLIC_API_ENDPOINT, PUBLIC_API_ENDPOINT_DEV, PUBLIC_API_ENV } from '$env/static/public';
import { GraphQLClient } from 'graphql-request';
import { browser } from '$app/environment';

const apiEndpoint = PUBLIC_API_ENV === 'production' ? PUBLIC_API_ENDPOINT : PUBLIC_API_ENDPOINT_DEV;
const client = new GraphQLClient(apiEndpoint);

async function getJWTToken(
	fetchFn: typeof globalThis.fetch = globalThis.fetch
): Promise<string | null> {
	try {
		const response = await fetchFn('/api/auth/token');

		if (response.status === 401) {
			console.debug('[GraphQLClient] User not authenticated (401)');
			return null;
		}

		if (!response.ok) {
			console.error('[GraphQLClient] Failed to fetch JWT token', {
				status: response.status,
				statusText: response.statusText
			});
			throw new Error(`Failed to get JWT token: ${response.status}`);
		}

		const data = await response.json();
		return data.token;
	} catch (error) {
		if (error instanceof TypeError) {
			console.debug('[GraphQLClient] Network error fetching token:', (error as TypeError).message);
		}
		throw error;
	}
}

export async function request<TResult, TVariables = unknown>(
	document: { toString(): string },
	variables?: TVariables,
	customHeaders?: HeadersInit,
	fetchFn?: typeof globalThis.fetch
): Promise<TResult> {
	const startTime = browser ? performance.now() : 0;
	const query = document.toString();
	const operationMatch = query.match(/(query|mutation)\s+(\w+)/);
	const operationName = operationMatch ? operationMatch[2] : 'Unknown';
	const operationType = operationMatch ? operationMatch[1] : 'unknown';

	try {
		const useFetch = fetchFn || globalThis.fetch;
		const token = await getJWTToken(useFetch);

		if (!token) {
			const authError = new Error('Authentication required');
			authError.name = 'AuthenticationError';
			throw authError;
		}

		const headers = {
			Authorization: `Bearer ${token}`,
			...customHeaders
		};

		const result = await client.request<TResult>(query, variables as Record<string, unknown>, headers);

		if (browser) {
			const duration = performance.now() - startTime;
			if (duration > 1000) {
				console.warn(`[GraphQLClient] Slow ${operationType}: ${operationName} (${Math.round(duration)}ms)`);
			}
		}

		return result;
	} catch (error: unknown) {
		const err = error as { name?: string; message?: string; response?: { status?: number } };

		const isAuthError =
			err?.name === 'AuthenticationError' ||
			err?.message === 'Authentication required' ||
			err?.message?.toLowerCase().includes('auth') ||
			err?.message?.toLowerCase().includes('token') ||
			err?.message?.toLowerCase().includes('permission');

		if (isAuthError) {
			console.debug('[GraphQLClient] Authentication error:', operationName);
		} else {
			console.error('[GraphQLClient] Request failed:', {
				operation: operationName,
				type: operationType,
				error
			});
		}

		throw error;
	}
}
