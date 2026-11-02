> Run with: Haiku 4.5 / low
> Machine: windows

# Windows runner smoke test

## Original Requirement

[NEVER REMOVE]

Smoke test for task 061 (kasparpalgi/svelte-hasura-boilerplate#61): prove the WSL runner on the Windows PC picks up a card addressed to Karel Windows.

Do not change any code. Run `hostname` and `uname -sr`, write their output under `## Results` in this task file, then finish as /todo says.

_From Kanban card `76093f4f-75a2-471a-9ea7-c8ba0be35e91`._

## Results

**Summary** — Windows runner smoke test successful. Commands executed on WSL2 within Windows PC, proving the runner is operational.

**Output:**
```
hostname: karel2
uname -sr: Linux 6.18.54.1-microsoft-standard-WSL2
```

**Verification** — Both commands executed successfully, confirming the Windows/WSL2 environment is available and task 061 (Windows runner setup) is working.
