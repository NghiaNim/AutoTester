# Progress

Read this, `DECISIONS.md` and `evals/SCOREBOARD.md` at the start of every session.
(`DECISIONS.md` and `evals/SCOREBOARD.md` do not exist yet; see "Next".)

## Where things stand (2026-11-12)

Milestone M0 is in progress. Nothing is committed yet. No gate has been run.

### Done

- Read the autograder repo (`lib/`, `rules/`, `supabase/`).
- Scaffolded Next.js 16 (App Router, strict TypeScript, Tailwind 4) with Zod 4, Supabase clients, vitest and tsx.
- Zod data contracts in `lib/schemas` for all eight contracts.
- OpenRouter client with input-hash cache, spend ledger, spend cap and retries (`lib/openrouter`), and per-role model config (`lib/config/models.ts`, provisional model IDs).
- Seven pipeline stages as stubs that return "not implemented" (`lib/pipeline`), plus the stage CLI (`cli/stage.ts`).
- Eval runner, scoreboard and history (`evals/run.ts`, `evals/lib`). E1, E2 and E3 have real scoring. E4 to E13 and R1 to R5 are registered with their bars and fail as "eval not built" after running their real prerequisites.
- Two synthetic dev style packs (`fixtures/packs/mc-quiz`, `fixtures/packs/worked-midterm`) and bad-source fixtures, built by `fixtures/build.ts`.
- Unit tests in `tests/`.

### Not verified

- `npm test`: 74 of 76 passed on the last run. The 2 failures were 5-second timeouts reading fixture files, on a machine whose disk was 100% full. Not re-run since.
- `npm run typecheck` passed earlier in the session, but not since the eval runner, CLI and tests were added.
- `npm run lint` and `npm run eval:all` have never been run.

### Blockers

- `.env.local` is missing (`OPENROUTER_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_KEY`). M1 cannot start without it.
- `owner_inputs/` is missing, so all fixtures are synthetic.
- The disk had 1.9 GB free and the repo sits in an iCloud-synced `Documents` folder. File reads took seconds, which made tests and the type check very slow.

## Next

1. Free disk space, then run `npm test`, `npm run typecheck`, `npm run lint` and `npm run eval:all`. Fix what they show.
2. Write `DECISIONS.md`, `docs/autograder-port.md`, `evals/CHANGELOG.md` and the README setup section.
3. Confirm every eval fails for the right reason, then commit M0.
4. Get the keys, then start M1 (thin slice).

## Open questions for the owner

- The web-page fixtures have a saved snapshot but no live URL yet. Where should the live copy be hosted?
- The DOCX samples are forced to 3 pages with explicit page breaks. The page count has not been checked in Word.
