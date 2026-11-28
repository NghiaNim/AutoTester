# Mock Test Studio

Turns a student's past tests and new study materials into printable, timed mock tests, then grades the handwritten result. Built with Next.js.

Status: milestone M0 (harness). The pipeline stages are stubs. See `PROGRESS.md`.

## Setup

```bash
npm install
```

Create `.env.local` with `OPENROUTER_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_KEY`.

## Run

```bash
npm run dev          # the app
npm test             # deterministic unit tests, no model calls
npm run typecheck
npm run lint
npm run eval -- E3   # one eval
npm run eval:all     # every gate; rewrites evals/SCOREBOARD.md; exits non-zero if any gate fails
npm run stage        # lists the pipeline stages and their command-line arguments
```

Eval flags: `--fresh` ignores the model-call cache, `--holdout` adds the holdout packs.

## Where things are

- `lib/schemas`: data contracts. `lib/pipeline`: the seven stages. `lib/openrouter`: model client.
- `evals`: runner, definitions, scoreboard, changelog. `fixtures`: style packs and their build script.
- `PROGRESS.md`, `DECISIONS.md`, `evals/SCOREBOARD.md`: read these first.
