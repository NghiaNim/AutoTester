# Progress

Read this, `DECISIONS.md` and `evals/SCOREBOARD.md` at the start of every session.

## Where things stand (2026-11-27)

**M0 is closed; M1 has not started.** `npm run eval:all` runs and all 13 gates fail for the right reason (unbuilt stage, missing fixtures, or awaiting owner); none crashes. `npm test` 76/76, type check and lint clean, re-checked on 2026-11-27 in this folder.

The repo lives at `~/Documents/autotester/AutoTester` again. It is the one place to develop, test and push from. `~/dev/AutoTester` is a stale copy (see `DECISIONS.md`).

### Built in M0

- Next.js 16 scaffold, Zod contracts (`lib/schemas`), OpenRouter client with cache and spend cap, per-role model config.
- Seven pipeline stages as stubs (`lib/pipeline`) and the stage CLI (`cli/stage.ts`).
- Eval runner, scoreboard, history. E1 to E3 have real scoring; E4 to E13 are registered with their bars.
- Dev packs `mc-quiz` and `worked-midterm`; bad-source fixtures. All synthetic: no owner inputs were supplied.
- `docs/autograder-port.md` (draft).

### Since M0 (2026-11-27)

- `.env.local` exists. `OPENROUTER_KEY` works (the key's spend limit is $10; it expires 2026-12-28). `GEMINI_KEY` is a Google AI Studio free-tier key; no app code reads it yet. The Supabase keys are empty.
- Extract and read moved to `google/gemini-4-hydrogen` (see `DECISIONS.md`).
- Checked by hand: all three provisional model IDs exist on OpenRouter. `gemini-4-hydrogen` returned JSON that passed `StyleProfileSchema` through Gemini's OpenAI-compatible endpoint, with the same request body the client already sends.
- The owner's first real use is a final exam. Its materials are **YouTube lecture links and slide decks**. No past or practice exams have been supplied yet.
- The Gemini API, called directly with `GEMINI_KEY`, watched a public YouTube URL (passed as `fileData`) on the free tier: speech and what is on screen, about 100 tokens per second of video. OpenRouter refused the same video request: it needs at least $1.00 of account balance for video.

### Known gotchas

- Gemini 4 models think before answering, and thinking tokens count against `max_tokens`. With a small budget the reply is empty and the client says only "The model returned an empty answer". It should name `finish_reason: length` (M1).
- OpenRouter uses the owner's Google key for Gemini (`is_byok: true`) until the free tier's per-minute limit, then silently falls back to OpenRouter credit.
- The client retries a 429 three times within about 1.5 seconds, which is too short to wait out a per-minute quota.
- Documents is synced to iCloud. If tests or the type check suddenly crawl, or a `node_modules 2` folder appears, that is iCloud again (see `DECISIONS.md`).

### Git

- Current branch `m0-harness`. Its M0 commit `bf0b608` is on GitHub only as the branch `wip/pre-wipe-branch-m0-harness`; GitHub's `main` still has just the initial commit.
- `wip/pre-wipe-snapshot` on GitHub (`52754a8`) holds the uncommitted files of the old Documents copy as of 2026-11-20. Everything in it is older than M0.
- Uncommitted here: `lib/config/models.ts`, `DECISIONS.md`, `PROGRESS.md`.

## Blocked

- **git does not run.** `/usr/bin/git` refuses until the Xcode license is accepted: `sudo xcodebuild -license accept` in Terminal. Nothing can be committed or pushed until then.
- **OpenRouter balance looks under $1** (the video request was refused with 402). The write, solve, grade and judge roles bill there.
- Supabase keys are needed from M6.

## Next

1. **Owner:** say what the final looks like: past or practice exams, or else the question types, number of questions and time limit. Without it the mock test cannot match the real one.
2. **Owner decision:** the build prompt puts video links out of scope and routes every call through OpenRouter. The owner's materials are YouTube links, so supporting them means changing both rows: video ingestion through the Gemini API with `GEMINI_KEY`.
3. **M1 thin slice:** one pack from samples to a graded report on the command line, crude quality, each stage's output valid against its schema. Order: ingestMaterials, extractStyle, planExam, writeExam, renderExam, readSubmission, gradeAttempt.

## Open questions for the owner

- Where should the live copies of the web-page fixtures be hosted? (`live_url` is null.)
- The DOCX samples are fixed at 3 pages by explicit page breaks; not checked in Word.
- No real past tests or materials were supplied, so everything is proven on synthetic data only.
