<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1>Users</h1>

{#if data.users.length === 0}
	<p>No users found.</p>
{:else}
	<ul>
		{#each data.users as user (user.uuid)}
			<li data-testid="user-item">
				<strong>{user.name}</strong> — {user.email}
			</li>
		{/each}
	</ul>
{/if}
