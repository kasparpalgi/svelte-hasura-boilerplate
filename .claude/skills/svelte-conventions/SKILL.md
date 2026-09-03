---
name: svelte-conventions
description: This project's code conventions — store factory pattern, optimistic updates, GraphQL workflow, logging, user feedback and the critical runtime rules. Use whenever writing or changing Svelte/TypeScript code in this repo.
paths:
  - src/**/*.svelte
  - src/**/*.ts
---

## Store Pattern (CRITICAL)

```typescript
import { browser } from '$app/environment';

function createStore() {
	const state = $state({ items: [], loading: false, error: null });

	async function loadItems() {
		if (!browser) return;
		state.loading = true;
		state.error = null;
		try {
			const data = await request(GET_ITEMS, {});
			state.items = data.items || [];
		} catch (error) {
			state.error = error.message;
		} finally {
			state.loading = false;
		}
	}

	const sorted = $derived([...state.items].sort((a, b) => a.order - b.order));

	return {
		get items() {
			return state.items;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		get sorted() {
			return sorted;
		},
		loadItems
	};
}

export const store = createStore();
```

Rules: single `$state` object · browser guard · loading reset in `finally` · getters prevent external mutation · return `{ success, message, data? }`.

---

## Optimistic Updates

```typescript
async function updateItem(id, updates) {
	const idx = state.items.findIndex((i) => i.id === id);
	if (idx === -1) return { success: false, message: 'Not found' };
	const original = { ...state.items[idx] };
	state.items[idx] = { ...original, ...updates }; // optimistic
	try {
		const data = await request(UPDATE_ITEM, { id, updates });
		const updated = data.update_items?.returning?.[0];
		if (!updated) throw new Error('Update failed');
		state.items[idx] = updated;
		return { success: true, message: 'Updated', data: updated };
	} catch (error) {
		state.items[idx] = original; // rollback
		return { success: false, message: error.message };
	}
}
```

---

## GraphQL Workflow

1. Add operation to `src/lib/graphql/documents.ts`
2. `npm run generate`
3. Import types from `src/lib/graphql/generated.ts`
4. Use `request()` from `src/lib/graphql/client.ts`
5. Verify in Hasura Console

---

## Logging

```typescript
import { loggingStore } from '$lib/stores/logging.svelte';
loggingStore.error('Component', 'msg', { error }); // persisted to DB
loggingStore.debug('Component', 'msg', { data }); // dev only
```

---

## User Feedback

```typescript
import { displayMessage } from '$lib/stores/errorSuccess.svelte';
displayMessage('Error occurred'); // error, 7 s
displayMessage('Saved!', 1500, true); // success, 1.5 s
```

## Critical Rules

- `if (!browser) return;` — always check before DOM/localStorage access.
- Never store sensitive data in localStorage.
- All GraphQL in `documents.ts`; run `npm run generate` after changes.
- Factory pattern for all stores; single `$state` object; expose via getters.
- All clickable elements (`<button>`, `<a>`, `onclick`, `role="button"`) **must** include `cursor-pointer` Tailwind class.
- Always use **Lucide** icons (`@lucide/svelte`) — never inline SVGs (exception: third-party brand logos like Google OAuth that require specific brand colors).
