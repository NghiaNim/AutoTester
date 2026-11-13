# Progress

Read this, `DECISIONS.md` and `evals/SCOREBOARD.md` at the start of every session.

## Where things stand (2026-11-12)

**M0 is closed.** `npm run eval:all` runs and all 13 gates fail for the right reason (unbuilt stage, missing fixtures, or awaiting owner); none crashes. `npm test` 76/76, type check and lint clean.

The repo now lives at `~/dev/AutoTester` (moved out of iCloud-synced Documents).

### Built in M0

- Next.js 16 scaffold, Zod contracts (`lib/schemas`), OpenRouter client with cache and spend cap, per-role model config.
- Seven pipeline stages as stubs (`lib/pipeline`) and the stage CLI (`cli/stage.ts`).
- Eval runner, scoreboard, history. E1 to E3 have real scoring; E4 to E13 are registered with their bars.
- Dev packs `mc-quiz` and `worked-midterm`; bad-source fixtures. All synthetic: no owner inputs were supplied.
- `docs/autograder-port.md` (draft).

## Blocked

- **`.env.local` is missing.** M1 calls real models and cannot start without `OPENROUTER_KEY`. Supabase keys are needed from M6.

## Next: M1 thin slice

One pack from samples to a graded report on the command line, crude quality, each stage's output valid against its schema. Order: ingestMaterials, extractStyle, planExam, writeExam, renderExam, readSubmission, gradeAttempt.

## Open questions for the owner

- Where should the live copies of the web-page fixtures be hosted? (`live_url` is null.)
- The DOCX samples are fixed at 3 pages by explicit page breaks; not checked in Word.
- No real past tests or materials were supplied, so everything is proven on synthetic data only.
