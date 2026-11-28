# Porting from the autograder

Source: `NghiaNim/autograder`, read on 2026-11-12 (`lib/`, `rules/`, `supabase/`). This is a draft; the "planned" rows become "done" as milestones close.

## Copied

| From the autograder | Here | Status |
| --- | --- | --- |
| `lib/utils/result.ts` (`Result<T>`, `ok`, `err`) | `lib/utils/result.ts`, unchanged | done |
| Layering from `rules/backend-patterns.mdc`: thin routes, services, actions, schemas | Same folders. Pipeline stages add `lib/pipeline`, pure functions with no database | done for the pipeline; routes in M6 |
| Rubric shape in `lib/schemas/rubric.schema.ts`: criteria with points and four levels | `lib/schemas/rubric.schema.ts` | done |
| `gradeSubmission` in `lib/actions/llm.actions.ts` | Seed of the open-ended grader in `lib/pipeline/grade-attempt.ts` | planned, M5 |
| Environment variable names | Same four names | done |

## Changed, and why

| In the autograder | Here | Why |
| --- | --- | --- |
| LangChain `ChatOpenAI` with `withStructuredOutput` | Plain `fetch` to OpenRouter with a JSON schema, validated by Zod | Caching by input hash, spend tracking and a spend cap for evals |
| One model at temperature 0.5 for everything | One model per role; grading at 0.1 | The repo's own design note suggests low temperature for grading |
| Rubric is criteria only, one per assignment | A rubric per question: criteria with levels, or step marks | Worked problems are marked by steps |
| Criterion points must be integers | Any positive number | Half marks exist |
| Exactly five problems (`.length(5)`, `total_problems: 5`) | Any number, numbered 1..n, checked by schema | The samples decide |
| `total_earned` from the model is stored unchecked | `GradeReportSchema` rejects a total that is not the sum, and points outside 0..max. Totals will be computed in code | A wrong score is the worst failure |
| Per-criterion reasoning is dropped | `QuestionGradeSchema` keeps level, points and reasoning per criterion | Feedback is the product |
| No answer key | `AnswerKeySchema`, separate from `ExamSchema`. The exam schema is strict, so key fields cannot ride along | The key must not reach the browser before submission |
| Image as a data URL in the database row | `AttemptSchema` pages hold storage paths | Private storage (M6) |
| No auth; row-level security commented out | Per-user access | planned, M6 |
| Grading inside one web request | Background jobs with saved progress | planned, M6 |

## Not ported

Teacher, student, share-code and whiteboard flows, and the classroom report. They are not this product.
