# Decisions

Choices made while building, with reasons. Rows in the build prompt's "Decisions already made" are not repeated here and are not changed without asking the owner.

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-11-12 | Next.js 16.4, React 19, Tailwind 4, Zod 4, vitest, tsx. | "Current stable versions" of the autograder's stack. |
| 2026-11-12 | Call OpenRouter with plain `fetch` and a JSON-schema `response_format`, not LangChain as the autograder does. | One small file gives us input-hash caching, the spend ledger and the spend cap that the evals need. Fewer dependencies. |
| 2026-11-12 | Model IDs are provisional: extract and read `google/gemini-4-carbon`, write and grade `anthropic/claude-sonnet-5.5`, solve and judge `openai/gpt-6.1-sol`. Override with `MODEL_<ROLE>`. | All were in the OpenRouter catalogue on this date. M3 picks each by eval score. Config refuses a solver or judge from the writer's family. |
| 2026-11-12 | Stages return `Result<T>`; an unbuilt stage returns status 501. Evals turn that into a failed gate with a reason, never a crash. | M0's gate: every eval fails for the right reason. "A gate you could not run is a failed gate." |
| 2026-11-12 | `npm run eval:all` uses dev packs. `--holdout` adds holdout packs. Only full runs write the scoreboard and count toward the two-in-a-row streak (`evals/history.json`). | Holdout runs only in M7. |
| 2026-11-12 | E3 to E7 generate from the profile the pipeline extracts from the non-held-back samples, not from the gold `style.json`. | That is what a user gets. E3 compares the exam with the profile it was generated from, as the prompt says. |
| 2026-11-12 | A planted fact "survives" when all of its key phrases appear within 500 characters of each other in the extracted text, after folding case, spacing and dash style. | Deterministic and free. Stricter than a bag of words, looser than exact wording. |
| 2026-11-12 | E2's "section order" is the ordered list of each section's question type and count. Titles are not compared. | Titles vary harmlessly ("Part A" against "Part A: Multiple Choice"). |
| 2026-11-12 | Two facts in each deck exist only inside a picture on a slide. | The prompt asks for slides to be read with a vision model as well as text extraction. This tests it. |
| 2026-11-12 | Web fixtures are saved snapshots served over HTTP from localhost during evals. `live_url` is null for now. | Repeatable and exercises real fetching, including 403, 404, empty and JavaScript-only pages. A live copy needs a host; see open questions. |
| 2026-11-12 | The DOCX samples use explicit page breaks so each is exactly 3 pages. | No Word or LibreOffice on this machine to measure the page count, so it is fixed by construction. |
| 2026-11-12 | E4 to E13 are registered with their bars but their scoring is written at the start of their milestone. | Evals before features still holds per milestone, and M0 stays small. The scoreboard says "eval not built". |
| 2026-11-12 | The repo moved from `~/Documents/autotester/AutoTester` to `~/dev/AutoTester`. | Owner's choice. iCloud was evicting the files on a nearly full disk, so every read stalled. |
| 2026-11-27 | Extract and read default to `google/gemini-4-hydrogen` instead of `google/gemini-4-carbon`. Calls stay on OpenRouter, which uses the owner's Google AI Studio key (bring your own key) for Gemini. | The owner's Google key is on the free tier, which allows 0 requests to carbon and does serve hydrogen. Under the free tier's per-minute limit OpenRouter falls back to its own credit, so some calls are still billed there. Still provisional until M3. |
| 2026-11-27 | The repo moved back from `~/dev/AutoTester` to `~/Documents/autotester/AutoTester`, which is again the one place to develop, test and push from. `~/dev/AutoTester` is stale and holds a `MOVED.txt`. | Owner's choice: one central folder. The drive was cleaned up (15 GB free on this date). iCloud Desktop & Documents sync is still on, so `node_modules` and build output sync to iCloud. If file reads stall again, turn that sync off or keep those folders out of it. |
