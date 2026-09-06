<script lang="ts">
	import {
		Mic,
		Puzzle,
		NotebookPen,
		FileText,
		ListChecks,
		Bot,
		BellRing,
		GitCommitHorizontal,
		ArrowLeft,
		ArrowRight,
		Layers
	} from '@lucide/svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	const capture = [
		{
			icon: Mic,
			title: 'Voice',
			desc: 'Dictate a card straight into the Backlog from your phone browser — no app, no keyboard, no laptop.'
		},
		{
			icon: Puzzle,
			title: 'Browser extension',
			desc: 'The "Save to Notes" Chrome extension drops any web page onto a board as a note, with an AI summary attached.'
		},
		{
			icon: NotebookPen,
			title: 'AI note taking',
			desc: 'Dictated notes get corrected and enhanced by AI, with a research mode for digging deeper before the work starts.'
		}
	];

	const loop = [
		{
			icon: FileText,
			title: 'Card becomes a task file',
			desc: 'Creating a card writes doc/todo/NNN-slug.md into the connected GitHub repo and opens a synced issue. The prompt lives at the top of that file forever.'
		},
		{
			icon: ListChecks,
			title: 'A plan pass sharpens it',
			desc: '/plan turns a raw voice dump into a real task: a requirement section, a model and effort line, and a scope that fits one session.'
		},
		{
			icon: Bot,
			title: 'Moving to TODO runs it',
			desc: 'The file is renamed -TODO.md and a local runner daemon picks it up, spawning Claude Code with /todo NNN — one card at a time, in a tmux session you can attach to and watch.'
		},
		{
			icon: BellRing,
			title: 'Your phone stays in the loop',
			desc: 'Push notifications fire on success and failure, herdr dings when the agent hits a prompt, and Remote Control lets you answer it from the phone.'
		},
		{
			icon: GitCommitHorizontal,
			title: 'Results close the loop',
			desc: 'The agent appends what it built, renames the file -DONE.md, commits and pushes. A webhook moves the card to Review (or Blocked) and comments the outcome back.'
		}
	];

	const pieces = [
		[
			'dev-kit plugin',
			'/plan · /todo · /verify · /security-review — one shared copy, every repo picks it up'
		],
		[
			'doc/todo/',
			'The prompt history: original request at the top, outcome at the bottom, never rewritten'
		],
		[
			'Kanban board',
			'Cards two-way synced with GitHub issues — capture, trigger and review in one place'
		],
		[
			'Runner daemon',
			'Watches the local clone, runs the agent at the model and effort the task file asks for'
		]
	];
</script>

<svelte:head>
	<title>Agentic development flow — My App</title>
	<meta
		name="description"
		content="From a voice note on your phone to a pushed commit: how the Kanban board, task files and a local agent runner close the loop."
	/>
</svelte:head>

<div class="flex min-h-screen flex-col bg-white">
	<!-- Nav -->
	<header class="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-md">
		<div class="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
			<a href="/" class="flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900">
				<Layers class="h-5 w-5 text-brand-600" />
				My App
			</a>
			<a
				href="/"
				class="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
			>
				<ArrowLeft class="h-3.5 w-3.5" /> Back home
			</a>
		</div>
	</header>

	<!-- Hero -->
	<section class="relative overflow-hidden px-6 py-20 text-center">
		<Badge class="mb-5">Agentic development</Badge>

		<h1
			class="relative mx-auto max-w-2xl text-4xl leading-[1.15] font-black tracking-tight text-gray-900 sm:text-5xl"
		>
			From a voice note<br />
			<span class="text-gradient">to a pushed commit</span>
		</h1>

		<p class="relative mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
			Say what you want while walking the dog. A task file is written, an agent runs it on your
			machine, and the card lands back in Review with the results attached — no laptop involved.
		</p>
	</section>

	<!-- Capture -->
	<section class="section-fade border-t border-gray-100 px-6 py-20">
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-3 text-center text-sm font-semibold tracking-widest text-brand-600 uppercase">
				Step one
			</h2>
			<h3 class="mb-12 text-center text-3xl font-bold text-gray-900">Capture from anywhere</h3>
			<div class="grid gap-6 sm:grid-cols-3">
				{#each capture as { icon: Icon, title, desc } (title)}
					<div
						class="rounded-xl border border-gray-200 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-popover"
					>
						<div class="mb-4 inline-flex rounded-lg bg-brand-100 p-2.5 text-brand-600">
							<Icon class="h-5 w-5" />
						</div>
						<h4 class="mb-2 font-semibold text-gray-900">{title}</h4>
						<p class="text-sm leading-relaxed text-gray-500">{desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- The loop -->
	<section class="border-t border-gray-100 px-6 py-20">
		<div class="mx-auto max-w-3xl">
			<h2 class="mb-3 text-center text-sm font-semibold tracking-widest text-brand-600 uppercase">
				What happens next
			</h2>
			<h3 class="mb-12 text-center text-3xl font-bold text-gray-900">The loop closes itself</h3>
			<ol class="relative space-y-8 border-l border-gray-200 pl-8">
				{#each loop as { icon: Icon, title, desc }, i (title)}
					<li class="relative">
						<span
							class="absolute -left-[45px] flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white ring-4 ring-white"
						>
							<Icon class="h-4 w-4" />
						</span>
						<h4 class="font-semibold text-gray-900">
							<span class="mr-2 text-brand-600">{i + 1}.</span>{title}
						</h4>
						<p class="mt-1 text-sm leading-relaxed text-gray-500">{desc}</p>
					</li>
				{/each}
			</ol>

			<h3 class="mt-20 mb-8 text-center text-3xl font-bold text-gray-900">
				Four pieces, nothing exotic
			</h3>
			<dl class="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-card">
				{#each pieces as [name, desc] (name)}
					<div class="flex flex-col gap-1 p-5 sm:flex-row sm:gap-6">
						<dt class="w-48 shrink-0 font-mono text-sm font-semibold text-gray-900">{name}</dt>
						<dd class="text-sm leading-relaxed text-gray-500">{desc}</dd>
					</div>
				{/each}
			</dl>

			<div class="mt-12 text-center">
				<a
					href="/signin"
					class="btn-glow inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-brand-700 active:scale-[0.98]"
				>
					Start building this way <ArrowRight class="h-4 w-4" />
				</a>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
		My App © {new Date().getFullYear()}
	</footer>
</div>
