/**
 * Builds the binary fixtures from the sources in fixtures/src.
 *   npx tsx fixtures/build.ts
 * Needs pdflatex on PATH for the LaTeX samples. The outputs are committed, so a new machine
 * does not need to run this.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import PptxGenJSImport from "pptxgenjs";
import sharp from "sharp";
import { countWords } from "../evals/lib/exam-text";
import { BUNDLES, Bundle, WebSection } from "./src/materials";
import { MC_COURSE, MC_INSTRUCTIONS, MC_NAME_LINE, MC_QUIZZES, McQuiz } from "./src/mc-quiz";
import { WORKED_COURSE, WORKED_EXAMS, WORKED_INSTRUCTIONS, WorkedExam } from "./src/worked-midterm";

const PptxGenJS = ((PptxGenJSImport as unknown as { default?: typeof PptxGenJSImport }).default ?? PptxGenJSImport) as typeof PptxGenJSImport;

const ROOT = path.resolve(import.meta.dirname, "..");
const packDir = (pack: string, ...rest: string[]) => path.join(ROOT, "fixtures", "packs", pack, ...rest);

function write(file: string, data: string | Uint8Array) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, data);
}

const stats: Record<string, { pages: number; words: number }> = {};

/* ---------- mc-quiz samples: DOCX ---------- */

const LABELS = ["A", "B", "C", "D"];
const MC_PAGE_BREAK_BEFORE = new Set([8, 15]);

async function buildQuiz(quiz: McQuiz) {
  const children: Paragraph[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: MC_COURSE, bold: true, size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: quiz.title, bold: true, size: 26 })] }),
    new Paragraph({ spacing: { after: 160 }, children: [new TextRun(MC_NAME_LINE)] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: MC_INSTRUCTIONS, italics: true })] }),
  ];
  quiz.questions.forEach((question, i) => {
    const number = i + 1;
    children.push(
      new Paragraph({
        keepNext: true,
        pageBreakBefore: MC_PAGE_BREAK_BEFORE.has(number),
        spacing: { before: 200, after: 60 },
        children: [new TextRun(`${number}. ${question.stem}`)],
      }),
    );
    question.options.forEach((option, j) => {
      children.push(
        new Paragraph({
          keepNext: j < question.options.length - 1,
          indent: { left: 540 },
          children: [new TextRun(`${LABELS[j]}. ${option}`)],
        }),
      );
    });
  });
  const doc = new Document({
    creator: "BIOL 101 staff",
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [
      {
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        children,
      },
    ],
  });
  write(packDir("mc-quiz", "samples", quiz.file), await Packer.toBuffer(doc));
  const text = [MC_INSTRUCTIONS, ...quiz.questions.flatMap((q) => [q.stem, ...q.options])].join(" ");
  stats[`mc-quiz/${quiz.file}`] = { pages: MC_PAGE_BREAK_BEFORE.size + 1, words: countWords(text) };
}

/* ---------- worked-midterm samples: LaTeX ---------- */

const PART_SPACE: Record<number, string> = { 3: "0.9in", 4: "1.4in", 5: "1.8in", 6: "2.2in" };

function texFor(exam: WorkedExam): string {
  const problems = exam.problems
    .map((problem, i) => {
      const parts = problem.parts
        .map((part, j) => `\\item[(${"abc"[j]})] [${part.points} points] ${part.text}\n\\vspace{${PART_SPACE[part.points] ?? "1.5in"}}`)
        .join("\n");
      return `\\noindent\\textbf{Problem ${i + 1}.} [${problem.points} points] ${problem.stem}\n\\begin{itemize}\n${parts}\n\\end{itemize}`;
    })
    .join("\n\n");
  return `\\documentclass[11pt]{article}
\\usepackage[letterpaper,margin=1in]{geometry}
\\usepackage{amsmath,amssymb}
\\pagestyle{plain}
\\begin{document}
\\noindent\\textbf{${WORKED_COURSE}}\\hfill\\textbf{${exam.exam}, ${exam.term}}\\\\[2pt]
\\noindent Name: \\rule{2.5in}{0.4pt}\\hfill Time: 50 minutes\\\\[6pt]
\\noindent\\textit{Instructions.} ${WORKED_INSTRUCTIONS}

\\bigskip

${problems}
\\end{document}
`;
}

function pdflatex(tex: string, outFile: string): number {
  const dir = mkdtempSync(path.join(tmpdir(), "fixture-tex-"));
  writeFileSync(path.join(dir, "doc.tex"), tex);
  const log = execFileSync("pdflatex", ["-interaction=nonstopmode", "-halt-on-error", "doc.tex"], { cwd: dir, encoding: "utf8" });
  write(outFile, readFileSync(path.join(dir, "doc.pdf")));
  const pages = /Output written on doc\.pdf \((\d+) pages?/.exec(log);
  if (!pages) throw new Error(`could not read the page count for ${outFile}`);
  return Number(pages[1]);
}

function buildMidterm(exam: WorkedExam) {
  const pages = pdflatex(texFor(exam), packDir("worked-midterm", "samples", exam.file));
  const text = [WORKED_INSTRUCTIONS, ...exam.problems.flatMap((p) => [p.stem, ...p.parts.map((part) => part.text)])].join(" ");
  stats[`worked-midterm/${exam.file}`] = { pages, words: countWords(text) };
}

/* ---------- materials: PPTX, HTML snapshot, topic list ---------- */

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A picture of a table, so its facts exist only as pixels in the deck. */
async function tableImage(rows: [string, string][]): Promise<Buffer> {
  const rowHeight = 110;
  const width = 1500;
  const height = rows.length * rowHeight + 20;
  const body = rows
    .map(([left, right], i) => {
      const y = 10 + i * rowHeight;
      return `<rect x="10" y="${y}" width="${width - 20}" height="${rowHeight}" fill="${i % 2 ? "#f3f4f6" : "#ffffff"}" stroke="#374151" stroke-width="2"/>
<line x1="430" y1="${y}" x2="430" y2="${y + rowHeight}" stroke="#374151" stroke-width="2"/>
<text x="30" y="${y + 66}" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="bold" fill="#111827">${escapeXml(left)}</text>
<text x="450" y="${y + 66}" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#111827">${escapeXml(right)}</text>`;
    })
    .join("\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#ffffff"/>${body}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function buildDeck(bundle: Bundle) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_4x3";
  pptx.author = "Course staff";
  const title = pptx.addSlide();
  title.addText(bundle.deckTitle, { x: 0.5, y: 2.4, w: 9, h: 1.2, fontSize: 40, bold: true, align: "center" });
  title.addText(bundle.deckSubtitle, { x: 0.5, y: 3.7, w: 9, h: 0.6, fontSize: 20, align: "center", color: "555555" });
  for (const slide of bundle.slides) {
    const s = pptx.addSlide();
    s.addText(slide.title, { x: 0.5, y: 0.35, w: 9, h: 0.9, fontSize: 30, bold: true });
    if ("bullets" in slide) {
      s.addText(
        slide.bullets.map((text) => ({ text, options: { bullet: true, breakLine: true } })),
        { x: 0.6, y: 1.5, w: 8.8, h: 5.2, fontSize: 20, valign: "top", paraSpaceAfter: 10 },
      );
    } else {
      const png = await tableImage(slide.imageRows);
      const meta = await sharp(png).metadata();
      const w = 9;
      s.addImage({ data: `image/png;base64,${png.toString("base64")}`, x: 0.5, y: 1.8, w, h: (w * meta.height!) / meta.width! });
    }
  }
  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  write(packDir(bundle.pack, "materials", "deck.pptx"), buffer);
}

function sectionHtml(section: WebSection): string {
  const parts = [`<h2>${escapeXml(section.heading)}</h2>`, ...section.paragraphs.map((p) => `<p>${escapeXml(p)}</p>`)];
  if (section.list) parts.push(`<ul>\n${section.list.map((item) => `  <li>${escapeXml(item)}</li>`).join("\n")}\n</ul>`);
  if (section.table) {
    parts.push(
      `<table>\n${section.table.map(([a, b]) => `  <tr><th scope="row">${escapeXml(a)}</th><td>${escapeXml(b)}</td></tr>`).join("\n")}\n</table>`,
    );
  }
  return parts.join("\n");
}

/** A saved page with the clutter real pages have: navigation, a consent banner, a sidebar, scripts and a footer. */
function buildWeb(bundle: Bundle) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeXml(bundle.webTitle)} | Open Course Notes</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:Georgia,serif;max-width:46rem;margin:2rem auto;line-height:1.6}nav a{margin-right:1rem}aside{border:1px solid #ccc;padding:1rem}</style>
<script>window.dataLayer = window.dataLayer || []; function track(e){ dataLayer.push({event: e}); } track("pageview");</script>
</head>
<body>
<div id="cookie-banner" role="dialog">We use cookies to remember your reading position. <button>Accept all</button> <button>Manage choices</button></div>
<header>
<nav><a href="/">Home</a><a href="/courses">Courses</a><a href="/library">Library</a><a href="/login">Sign in</a></nav>
</header>
<main>
<article>
<h1>${escapeXml(bundle.webTitle)}</h1>
<p class="byline">Open Course Notes · 9 minute read</p>
<p>${escapeXml(bundle.webIntro)}</p>
${bundle.webSections.map(sectionHtml).join("\n")}
</article>
<aside>
<h3>Popular this week</h3>
<ul><li><a href="/notes/study-habits">Ten study habits that work</a></li><li><a href="/notes/exam-anxiety">Managing exam anxiety</a></li><li><a href="/notes/citation">How to cite a source</a></li></ul>
<p>Subscribe to the newsletter for weekly study tips.</p>
</aside>
</main>
<footer><p>© Open Course Notes. Terms of use · Privacy policy · Contact</p></footer>
<script>document.getElementById("cookie-banner").addEventListener("click", function(){ this.remove(); });</script>
</body>
</html>
`;
  write(packDir(bundle.pack, "materials", "web", "snapshot.html"), html);
  write(packDir(bundle.pack, "materials", "topic-list.txt"), bundle.topicList.join("\n") + "\n");
}

/* ---------- sources that must be refused ---------- */

async function buildBadSources() {
  const dir = path.join(ROOT, "fixtures", "bad-sources");
  pdflatex("\\documentclass{article}\\pagestyle{empty}\\begin{document}\\null\\end{document}\n", path.join(dir, "blank.pdf"));
  const emptyDoc = new Document({ sections: [{ children: [new Paragraph("")] }] });
  write(path.join(dir, "empty.docx"), await Packer.toBuffer(emptyDoc));
  write(path.join(dir, "corrupt.pptx"), Buffer.from("This is not a zip archive, whatever the file name says.\n"));
  const blank = await sharp({ create: { width: 1200, height: 1600, channels: 3, background: "#ffffff" } }).png().toBuffer();
  write(path.join(dir, "blank-page.png"), blank);
}

async function main() {
  for (const quiz of MC_QUIZZES) await buildQuiz(quiz);
  for (const exam of WORKED_EXAMS) buildMidterm(exam);
  for (const bundle of BUNDLES) {
    await buildDeck(bundle);
    buildWeb(bundle);
  }
  await buildBadSources();
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
