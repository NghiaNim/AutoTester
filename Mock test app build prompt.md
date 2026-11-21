# Mock test app: build prompt

Nov 12, 2026 · @Nghia Nim

## Your job

Build a web app that turns a student's past tests and new study materials into printable, timed mock tests, then grades the handwritten result. Working name: Mock Test Studio.

You are finished when the evals in this prompt pass, not when the code is written. An eval is a repeatable test with a fixed dataset, a score and a pass bar. Every feature below exists to move one of those scores.

Put correctness first. The user will trust the answer key and the grade, so a wrong key or a wrong score is worse than a slow or plain app.

### Owner inputs

| Input | Location or default | If missing |
| --- | --- | --- |
| Real past tests | `owner_inputs/samples/` | Continue with synthetic fixtures and say so |
| Real study materials | `owner_inputs/materials/` | Continue with synthetic fixtures and say so |
| Keys | `.env.local` with `OPENROUTER_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_KEY` | Stop and ask |
| Paper size | US Letter | Use the default |
| Spend cap for one full eval run | 30 USD | Use the default |

## How to work

1. **Read first.** Clone `https://github.com/NghiaNim/autograder`. Read everything under `lib/`, `rules/` and `supabase/` before you design anything.
2. **Evals before features.** Write each eval and its fixtures before the code it tests. Watch it fail for the right reason, then build.
3. **Thin slice first.** Push one test through the whole pipeline with crude quality. Then deepen one stage at a time.
4. **Keep the core pure.** Each pipeline stage is a library function with a command-line entry, no browser and no database. The web app is a shell around them. This keeps evals fast and repeatable.
5. **Keep three living files.** `PROGRESS.md` holds what is done and what is next. `DECISIONS.md` holds choices and reasons. `evals/SCOREBOARD.md` is generated, one row per eval. Read all three at the start of every session.
6. **Commit at every passed gate.**

### Rules that protect the evals

- Never lower a pass bar, delete a failing case or edit a gold label to make a run pass. If a bar or label looks wrong, stop and show the evidence.
- No code may branch on fixture names, IDs or contents.
- Tune on dev fixtures only. Holdout fixtures run only in M7. If dev passes and holdout fails, the fix must be general.
- A gate counts when it passes on two full runs in a row. Report every percentage with its count, such as 37/40.
- Log each change to an eval, fixture or bar in `evals/CHANGELOG.md` with the reason.

### When to stop and ask

Ask the owner only when:

- keys or a required service are missing;
- a gate still fails after three substantially different attempts, in which case bring the failing cases and your options;
- a choice would change a row in "Decisions already made";
- the next eval run would pass the spend cap;
- you need the owner's labels or sign-off (E2 on owner samples, the E9 real set, E13).

Otherwise decide, record it in `DECISIONS.md` and keep going.

## The product

One journey in five steps.

1. **Create a style.** The user uploads one or more past tests as PDF, DOCX or photos. The app extracts a style profile: sections, question types, counts, points, time limit, wording habits, difficulty and answer space. The user reviews it, edits it and saves it under a name for reuse.
2. **Add materials.** The user adds what the new test should cover: slide decks, documents, images, links or a typed list of topics. The app shows the topics it found. The user can reweight or exclude them.
3. **Generate.** The app writes a new test about the materials, in the saved style, with the same structure and length. It mirrors whatever question formats the samples use and assumes none. The user may change the length or duration first. The user downloads a print-ready PDF. The answer key stays hidden until submission.
4. **Sit the test.** After printing, the user presses Start. A countdown runs for the style's time limit, survives refreshes and device changes, warns at set marks and ends with "time's up".
5. **Submit and get graded.** The user photographs or scans the finished pages, usually with a phone. The app reads the handwriting and asks the user to confirm anything it was unsure of. It then grades each question and shows a report: total, per-question feedback, correct solutions and results by topic.

The user can generate further versions from the same style and materials. Versions must differ.

## Decisions already made

The owner can change any row. Do not change one without asking.

| Topic | Decision | Reason |
| --- | --- | --- |
| Stack | Same as the autograder: Next.js App Router, strict TypeScript, Tailwind, Zod, Supabase, OpenRouter. Use current stable versions. | The grader ports cleanly. |
| Codebase | New repository. Port the grading core. Do not fork the classroom app. | Its teacher, student and whiteboard flows are not this product. |
| Users | Individual learner accounts. Supabase Auth, row-level security on, private file storage, and a way to delete one's data. | Uploads are private course materials and past exams. |
| Models | One configurable model ID per role: extract, write, solve, read, grade, judge. Pick each by running the evals on two or three current candidates. Solver and judge come from a different model family than the writer. Prompts live in versioned files. | Line-ups change, so scores should choose. A different family is less likely to repeat the writer's mistake. |
| Question formats | Any text-based format: multiple choice, true/false, matching, fill-in, numeric, short answer, worked problems, essays, code reading. Math, tables and code blocks are supported. | The samples decide the format, not the app. |
| Figures | Not generated in v1. If samples depend on diagrams, list that under "not reproduced" in the profile and tell the user. | An honest limit beats a bad diagram. |
| Output file | PDF is the graded format, rendered from HTML by headless Chromium with a math renderer. DOCX export is optional and comes last. | Print layout and math are reliable this way. |
| Page IDs | Each printed page carries a small QR code with exam ID and page number. | It sorts shuffled pages, catches missing ones and rejects the wrong exam without guessing. |
| Links | Web pages and direct links to files. Video links are out of scope. | Keeps ingestion testable. |
| Submission | Photos (JPEG, PNG, HEIC) or a scanned PDF. Design the upload page for phones first. | The camera is on the phone. |
| Long jobs | Generation and grading run as background jobs with saved progress, retries and resume. | They take minutes. The autograder grades inside one web request, which will not hold for a whole paper. |
| Timer | The server owns the clock. No pause by default. An extra-time multiplier is available. | Exam conditions, and the device clock cannot fool it. |
| Language | English is gated. Other languages should work but are not measured. | Scope. |

Out of scope for v1: classroom or teacher features, proctoring, payments, native apps, on-screen test taking and diagram generation.

## The autograder repo

`NghiaNim/autograder` is a Next.js 14 classroom app with no tests. A teacher enters a title and description, and a model writes exactly five problems plus one rubric. A student draws each answer on a canvas. The image and rubric go to a vision model, which returns a score.

### Reuse

- The layering and conventions in `rules/`: thin routes in `app/api`, orchestration in `lib/services`, database and model calls in `lib/actions`, Zod schemas in `lib/schemas`, and `Result<T>` from `lib/utils/result.ts`.
- The rubric shape in `lib/schemas/rubric.schema.ts`: criteria with points and four levels (Excellent, Good, Developing, Beginning).
- `gradeSubmission` in `lib/actions/llm.actions.ts`. It sends rubric, question and image, and gets back a level, points and reasoning per criterion. This is the seed of the open-ended grader.
- The OpenRouter client with structured output in `lib/openrouter/client.ts`.

### Gaps to close when porting

| In the repo today | Needed here |
| --- | --- |
| One canvas image per problem | Multi-page photos of a printed test, mapped to questions |
| One generic rubric shared by all problems, and no answer key | A key and rubric per question, with objective questions scored by code |
| Exactly five problems, fixed in the schema and the report | Any number |
| The model's own `total_earned` is stored unchecked | Totals computed in code, with points clamped to each question's range |
| Per-criterion reasoning is dropped and students see only a score | Keep everything, because feedback is the product |
| One model at temperature 0.5 for both writing and grading | A model per role, and low temperature for grading as `rules/auto-grader-design.mdc` itself suggests |
| The image travels as a data URL and is stored in the database row | Files in private storage, with rows holding references |
| No auth, and row-level security is commented out | Per-user access |

Write `docs/autograder-port.md`: what you copied, what you changed and why.

## Data contracts

Define these as Zod schemas in `lib/schemas`. The fields below are the minimum.

- **StyleProfile** is a reusable description of how a test looks and reads.
  - Time limit and total points, each marked as stated or estimated.
  - Ordered sections, each with instructions, question type, count and points.
  - Per question type: stem length range, option count and labels, sub-part pattern, answer space, and whether work must be shown.
  - Difficulty mix across recall, apply and analyze.
  - Voice notes, plus two or three exemplar questions per type marked "never copy".
  - Layout: paper size, columns, numbering, where points appear.
  - A "not reproduced" list.
- **MaterialSet** is the normalized study content. It holds chunks with stable IDs, text and a source location (file plus page or slide, or URL). It also holds a topic map with weights and a flag for topic-list-only input.
- **Blueprint** is the plan for one test. It has one slot per question: section, type, points, difficulty, topic and source chunk IDs.
- **Exam** is the test without answers. Each question has a number, type, prompt in Markdown with LaTeX, options, points, answer space, topic and source references. The renderer adds a layout manifest: which questions sit on each page and where their answer boxes are.
- **AnswerKey** is stored apart from the Exam and never sent to the browser before submission. Per question it holds the correct answer (an option, a value with tolerance, or a list of accepted answers), a reference solution, a rubric and common mistakes. The rubric is either criteria with levels, as in the autograder, or step marks.
- **Attempt** is one sitting. Status moves through not started, in progress, time up, submitted, reading, needs review, grading and graded. It records start time, duration, extra-time factor, submit time, minutes late and the uploaded pages.
- **Reading** is what the student wrote. Per question it holds the transcription or selected option, a confidence, a page reference and a state: answered, blank or unreadable.
- **GradeReport** is the result. Per question it holds points, maximum, level and reasoning per criterion, feedback, the correct solution and a confidence. Totals are computed in code. It includes a breakdown by topic and type, and the time used.

## Pipelines

Seven stages. Each is a pure function with a command-line entry.

1. **`extractStyle(samples)` returns a StyleProfile.** Read each sample as text and as page images, because tests are visual. Merge several samples into one profile and record where they disagree.
2. **`ingestMaterials(inputs)` returns a MaterialSet.** Accept PDF, PPTX, DOCX, images, URLs and topic lists. Read slides and scans with a vision model as well as text extraction. If a source yields little or no text, raise a clear error. Never generate from empty content.
3. **`planExam(style, materials)` returns a Blueprint.** Code sets counts, types, points and order from the profile, then spreads topics across slots by weight. Models miscount, so structure is never left to one. If the materials are too thin to fill every slot, tell the user and offer a shorter test instead of padding.
4. **`writeExam(blueprint)` returns an Exam and an AnswerKey.** For each slot, retrieve its source chunks, write the question in the style's voice, then write the key and rubric. For topic-list-only input, questions come from model knowledge, so label that exam "general knowledge, not your materials". Verify every question before accepting it, and regenerate on failure up to a retry cap:
   - an independent solver answers from the materials without seeing the key, and must agree with it;
   - a second check finds no other defensible option;
   - no near-duplicate exists in this test, in earlier versions or in the sample tests.
5. **`renderExam(exam)` returns a PDF and a layout manifest.** A separate function renders the answer-key PDF. The student renderer takes no AnswerKey, so a leak is impossible by construction. Every page gets its QR code. Answer space follows the profile.
6. **`readSubmission(exam, pages)` returns Readings.** Normalize uploads: HEIC, rotation, PDF to images. Identify exam and page from the QR code, with a vision model as fallback. Report missing, duplicate and foreign pages before grading. Extract each response with a confidence. Start with whole-page reading plus the manifest's question list, and add box cropping only if E8 needs it. A blank is read as blank. Never invent an answer.
7. **`gradeAttempt(exam, key, readings)` returns a GradeReport.** Objective questions are compared in code. Open-ended questions use the ported autograder call, given the answer image, transcription, reference solution and rubric. Student writing is data, never instructions. Low-confidence readings go to "needs review". The user confirms the reading, then grading finishes.

### The app around them

- **Timer.** The server stores the start time. The client shows remaining time computed from timestamps, never from counted ticks. Default warnings come at half time, ten minutes and five minutes. At zero the attempt becomes "time up" exactly once. Later uploads are accepted and stamped with minutes late. Keep the screen awake where the browser allows.
- **Screens.** Styles (list, create, review and edit). Materials. Generate and download. Attempt with timer. Submit, with phone camera upload and a page checklist. Review flagged readings. Report.
- **Jobs.** Show progress per step. A failed step retries without redoing finished ones.

## Evals: the finish conditions

Four terms first.

- A **fixture** is a saved input with a known right answer.
- **Dev** fixtures are for tuning. **Holdout** fixtures check that the tuning generalizes.
- A **judge** is a model that scores output against a rubric. Trust a judge only after it passes its own check.
- A **gate** must pass. A **reported** number is tracked but does not block.

### Mechanics

- `npm run eval -- E3` runs one eval. `npm run eval:all` runs every gate, rewrites the scoreboard, prints the spend and exits non-zero if any gate fails.
- Evals call real models. Cache calls by input hash so unchanged reruns cost nothing. Sign-off runs use `--fresh`.
- Generate the exam set once per run and reuse it across E3 to E7.
- `npm test` covers deterministic code with no model calls: blueprint, score arithmetic, timer, schemas, QR encode and decode.
- The pass bars are the owner's starting points and are strict on purpose.

### Fixtures to build first

1. **Style packs.** Build at least six distinct styles: four dev, two holdout. Cover multiple choice only, mixed objective and short answer, worked math problems, essays, code reading, and matching or fill-in. Owner files become packs first; draft their `style.json` and have the owner confirm it. Build synthetic packs with different authoring tools, including one image-only scanned PDF, so parsing is not tested only on your own renderer's output. Each pack holds:
   - two or three sample tests in one style, one held back as the real reference;
   - a hand-checked `style.json` with the true counts, sections, points and time limit;
   - a materials bundle on a different subject from the samples, in three forms: a slide deck, a web page (live URL plus saved snapshot) and a topic list;
   - `planted_facts.json` with 15 facts that must survive ingestion, and `topics.json` with what a fair test should cover.
2. **Filled-in submissions.** Build at least 30 completed tests with 400 responses, 150 of them open-ended. Script answers into the PDFs in varied handwriting fonts. Produce a clean-scan version and a phone-photo version with skew, rotation, shadow, blur and compression. Write each open-ended answer at a designed level (full, partial with a named gap, wrong, blank, off-topic) with gold points and a one-line reason. Include changed answers, shuffled pages, a missing page, a duplicate page and a page from another exam.
3. **Real handwriting set.** Font handwriting is easier to read than real handwriting. For the final gate, the owner prints two generated tests, answers by hand, photographs them and marks them. Prepare the PDFs and a score sheet, then stop and ask.

### Gates for inputs

| Eval | Measure | Pass bar |
| --- | --- | --- |
| **E1 Ingestion.** Materials are read in full. | Share of planted facts found in the extracted text, per input type. Behavior on blocked or empty sources. | At least 95% per type. Every bad source raises a visible error and blocks generation. |
| **E2 Style extraction.** The profile matches the samples. | Extracted profile against `style.json` on six fields: question count, section order, question types, total points, time limit, option count. | All six exact on at least 90% of samples. No field off by more than 10% on the rest. |

### Gates for generation

| Eval | Measure | Pass bar |
| --- | --- | --- |
| **E3 Structure and length.** The new test has the same size and shape. | Generated exam against the profile, two generations per pack per material form. | Every exam: sections, order, count per type and total points exact. Page count within one page or 15% of the samples, whichever is larger. Word count within 20%. |
| **E4 Style match.** It reads like the user's tests. | A blind judge compares a generated test with real samples, ignoring subject. It scores six dimensions from 1 to 5: wording, stem length, difficulty, option or sub-part construction, formatting conventions, and "same author". Each pack has two anchors. The ceiling is real against real in the same style. The floor is real against real across styles. | Judge check first: ceiling minus floor is at least 1.5. Then the generated mean is within 0.5 of the ceiling, and no dimension is more than 1.0 below it, over at least 40 comparisons. |
| **E5 Grounding and coverage.** Content comes from the new materials only. | (a) A judge sees only the cited chunks and confirms they support the keyed answer. (b) Share of `topics.json` topics with at least one question. (c) Questions on sample-only subjects, or near-duplicates of sample questions. (d) Near-duplicate share between two versions from the same inputs. | (a) At least 95%. (b) At least 90% when the test has as many questions as topics. (c) Zero. (d) At most 15%. |
| **E6 Answer-key correctness.** The key is right. | Independent solver against the key on objective questions. Judge flags for more than one, or no, defensible option. Share of keys at each option position. How often the longest option is the correct one. | Agreement at least 98%. Flags at most 2%. In tests with 20 or more four-option questions, no position holds over 40% of keys, and the longest option is correct under 40% of the time. |

### Gates for paper

| Eval | Measure | Pass bar |
| --- | --- | --- |
| **E7 Print-ready PDF.** The download prints correctly and leaks nothing. | Page size. QR decodes from a 150 dpi image of every page. Leftover markup such as `\frac`, `$$` or `**` in the extracted text. Clipped or overlapping content, or options split from their question across pages. AnswerKey content in the student PDF or in any API response before submission. | Every exam passes every check. Zero leaks. |
| **E8 Reading.** The app reads the paper correctly. | Page identification. Detection of missing, duplicate and foreign pages. Selected-option accuracy. Changed answers. Blank handling. Whether short-answer transcriptions keep the meaning. | Page ID 100% on scans and at least 98% on photos. Detection 100%. Options at least 99% on scans and 97% on photos. Changed answers at least 90%. No blank earns points, and at most 1% of real answers are read as blank. Transcription at least 95%. |

### Gates for grading

| Eval | Measure | Pass bar |
| --- | --- | --- |
| **E9 Grading accuracy.** Scores match a careful human marker. | Objective questions: score given the reading. Open-ended: distance from gold, and mean signed error, which shows leniency or harshness. Exam total against gold. | Objective 100%. Open-ended within 25% of the question's points (one rubric level) on at least 90%, exact on at least 65%, mean signed error within 5% of available points. Total within 5 percentage points on at least 90% of papers and never beyond 10. Real handwriting set: total within 7 points on every paper, with each disagreement listed for the owner. |
| **E10 Trust.** Grading is stable and cannot be talked into marks. | (a) The same paper graded three times. (b) Answers that contain instructions to the grader, against the same answers without them, 20 pairs or more. (c) Invariants: points between zero and the maximum, total equals the sum. (d) Share of wrong readings that were flagged for review, and share of right readings flagged. (e) A judge checks that feedback agrees with the score and rubric. | (a) Total spread at most 2 points, and at least 95% of questions identical. (b) Identical scores on every pair. (c) Always. (d) At least 80% caught, at most 15% false flags. (e) At least 95%. |

### Gates for the app

| Eval | Measure | Pass bar |
| --- | --- | --- |
| **E11 Timer.** The clock is honest. | Fake-clock tests: reload, close and reopen, second device, background tab across a simulated three-hour exam, two tabs open at zero, device clock changed, 1.5× extra time, upload after time. | Remaining time correct within one second in every case. Exactly one time-up transition. Late uploads stamped. |
| **E12 End to end.** The whole journey works unaided. | A headless browser, with a phone-sized screen for upload, runs style, materials, generate, download, start, time passing, upload, confirm flags and report. It covers every pack and all three material forms. It also cuts the model API mid-job, and checks that one user cannot read another user's data. | Every run completes. Report total within the E9 tolerance. Failures show a readable error and resume. Cross-user reads are refused. |
| **E13 Owner acceptance.** A person agrees. | The owner reviews three tests generated from their own samples and materials, then sits one on paper with a phone. | "Would pass as one of my tests" on all three. At most one key error per 40 questions. AI total within 7 points of the owner's own marking. |

### Reported, not gating

- Time to generate and time to grade a 40-question test. Flag anything over five minutes.
- Spend per generate-and-grade cycle.
- Share of questions regenerated during verification.
- Review-flag rate.
- How often a judge prefers the full pipeline over the same blueprint written without style exemplars. It should be well above half.

## Milestones

Build in this order. A milestone closes when its gates pass on dev fixtures and every earlier gate still passes.

| Milestone | Build | Gates |
| --- | --- | --- |
| M0 Recon and harness | Read the autograder and draft `docs/autograder-port.md`. Scaffold the project and the Zod contracts. Build the eval runner, cache and scoreboard. Create two dev style packs. | `npm run eval:all` runs, and every eval fails for the right reason instead of crashing. |
| M1 Thin slice | A command-line run takes one pack from samples to a graded report, at crude quality. | The run completes, and each stage's output validates against its schema. |
| M2 Inputs | Style extraction and material ingestion. The remaining style packs. | E1, E2 |
| M3 Generation | Blueprint, question writing and verification. Choose models by eval score. | E3, E4, E5, E6 |
| M4 Paper | PDF rendering and page IDs. The filled-in submission fixtures. Reading. | E7, E8 |
| M5 Grading | Port and extend the autograder's grader. | E9 on synthetic submissions, E10 |
| M6 App | Auth, storage, background jobs, screens, timer, phone upload and report. | E11, E12 |
| M7 Proof | Run everything on holdout packs. Run twice with `--fresh`. Prepare the owner's kit and collect sign-off. | Every gate on dev and holdout. E9 on the real handwriting set. E13. |

## Definition of done

All five are true:

1. `npm run eval:all -- --fresh` exits zero twice in a row from a clean checkout, on dev and holdout fixtures.
2. The owner has signed off E13 and the real handwriting part of E9.
3. `npm test`, the type check and the linter pass.
4. The README takes a new machine from clone to a running app with one setup command and one start command.
5. The repository holds no secrets.

### Final report

Write `REPORT.md` with:

- the scoreboard, with a count beside every percentage;
- the model chosen for each role and the comparison that chose it;
- the remaining failures for each gate, with examples;
- what was proven only on synthetic data;
- known limits, such as figures;
- spend and time per generate-and-grade cycle;
- every entry in `evals/CHANGELOG.md`;
- open questions for the owner.

State plainly what is unproven. A gate you could not run is a failed gate, not a passed one.
