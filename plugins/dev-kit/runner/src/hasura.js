/** Tiny admin-secret GraphQL client for the Kanban's Hasura. No dependencies. */

export function makeClient(endpoint, adminSecret) {
	return async function gql(query, variables) {
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'content-type': 'application/json', 'x-hasura-admin-secret': adminSecret },
			body: JSON.stringify({ query, variables })
		});
		const body = await res.json();
		if (body.errors) throw new Error(body.errors.map((e) => e.message).join('; '));
		return body.data;
	};
}

/**
 * Cards sitting in the TODO column of a *mapped* board, oldest first.
 *
 * `$repos` is a SIMILAR TO alternation of the `owner/repo` names in the config, matched
 * against `boards.github` (a text column holding the integration's JSON). Without it the
 * admin secret returns every user's TODO card on the shared instance — 49 users' cards
 * into this process's logs to reach the handful that are ours.
 */
export const PENDING = `
	query Pending($list: String!, $repos: String!, $limit: Int!) {
		todos(
			where: { list: { name: { _eq: $list }, board: { github: { _similar: $repos } } } }
			order_by: { sort_order: asc }
			limit: $limit
		) {
			id
			title
			content
			user_id
			list_id
			list {
				board {
					github
					lists {
						id
						name
					}
				}
			}
		}
	}
`;

/** Claim by moving TODO -> Doing. affected_rows === 0 means someone else got it. */
export const CLAIM = `
	mutation Claim($id: uuid!, $from: uuid!, $to: uuid!) {
		update_todos(where: { id: { _eq: $id }, list_id: { _eq: $from } }, _set: { list_id: $to }) {
			affected_rows
		}
	}
`;

/** Move the card to its final column and leave the outcome as a comment. */
export const REPORT = `
	mutation Report($id: uuid!, $list: uuid!, $userId: uuid!, $comment: String!) {
		update_todos_by_pk(pk_columns: { id: $id }, _set: { list_id: $list }) {
			id
		}
		insert_comments_one(object: { todo_id: $id, user_id: $userId, content: $comment }) {
			id
		}
	}
`;
