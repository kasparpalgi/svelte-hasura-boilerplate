import { serverRequest } from '$lib/graphql/server-client';
import { GET_USERS } from '$lib/graphql/documents';
import type { GetUsersQuery } from '$lib/graphql/generated/graphql';

export async function load() {
	const data = await serverRequest<GetUsersQuery>(GET_USERS);
	return { users: data.users };
}
