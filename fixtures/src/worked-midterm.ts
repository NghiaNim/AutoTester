/** Sample tests for the worked-midterm pack. Subject: differential calculus. Typeset with LaTeX. */

export type WorkedPart = { points: number; text: string };
export type WorkedProblem = { points: number; stem: string; parts: WorkedPart[] };
export type WorkedExam = { file: string; exam: string; term: string; problems: WorkedProblem[] };

export const WORKED_COURSE = "MATH 151 --- Calculus I";
export const WORKED_INSTRUCTIONS =
  "Show all work. Answers without justification receive no credit. No calculators. There are 5 problems worth a total of 50 points.";

const p = (points: number, stem: string, ...parts: [number, string][]): WorkedProblem => ({
  points,
  stem,
  parts: parts.map(([pts, text]) => ({ points: pts, text })),
});

export const WORKED_EXAMS: WorkedExam[] = [
  {
    file: "midterm-fall.pdf",
    exam: "Midterm 1",
    term: "Fall",
    problems: [
      p(10, "Evaluate each limit. If a limit does not exist, explain why.",
        [5, "$\\displaystyle \\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3}$"],
        [5, "$\\displaystyle \\lim_{x \\to 0} \\frac{\\sin(5x)}{2x}$"]),
      p(12, "Differentiate each function. You do not need to simplify your answers.",
        [4, "$f(x) = x^3 e^{2x}$"],
        [4, "$g(x) = \\dfrac{x^2 + 1}{3x - 2}$"],
        [4, "$h(x) = \\ln(\\cos x)$"]),
      p(10, "Consider the curve defined by $x^2 + xy + y^2 = 7$.",
        [6, "Use implicit differentiation to find $\\dfrac{dy}{dx}$."],
        [4, "Find an equation of the tangent line to the curve at the point $(1, 2)$."]),
      p(8, "A spherical balloon is inflated so that its volume increases at a constant rate of $100\\ \\text{cm}^3/\\text{s}$.",
        [5, "How fast is the radius increasing at the instant when the radius is $5$ cm?"],
        [3, "State the units of your answer and explain in one sentence what it means."]),
      p(10, "A farmer has $200$ m of fencing to enclose a rectangular field that borders a straight river. No fence is needed along the river.",
        [4, "Write the area of the field as a function of one variable and state its domain."],
        [6, "Find the dimensions that maximize the area. Justify that your answer is a maximum."]),
    ],
  },
  {
    file: "midterm-spring.pdf",
    exam: "Midterm 1",
    term: "Spring",
    problems: [
      p(10, "Evaluate each limit. If a limit does not exist, explain why.",
        [5, "$\\displaystyle \\lim_{x \\to 2} \\frac{x^2 + x - 6}{x^2 - 4}$"],
        [5, "$\\displaystyle \\lim_{x \\to \\infty} \\frac{3x^2 - x}{5x^2 + 4}$"]),
      p(12, "Differentiate each function. You do not need to simplify your answers.",
        [4, "$f(x) = x^2 \\sin(3x)$"],
        [4, "$g(x) = \\dfrac{e^x}{x^2 + 4}$"],
        [4, "$h(x) = \\sqrt{1 + \\tan x}$"]),
      p(10, "Consider the curve defined by $y^3 + x^2 y = 10$.",
        [6, "Use implicit differentiation to find $\\dfrac{dy}{dx}$."],
        [4, "Find an equation of the tangent line to the curve at the point $(1, 2)$."]),
      p(8, "A ladder $5$ m long rests against a vertical wall. The bottom of the ladder slides away from the wall at $0.5\\ \\text{m}/\\text{s}$.",
        [5, "How fast is the top of the ladder sliding down the wall at the instant when the bottom is $3$ m from the wall?"],
        [3, "State the units of your answer and explain in one sentence what its sign means."]),
      p(10, "An open-top box with a square base must have a volume of $32\\ \\text{cm}^3$.",
        [4, "Write the surface area of the box as a function of the side length of the base and state its domain."],
        [6, "Find the dimensions that minimize the surface area. Justify that your answer is a minimum."]),
    ],
  },
  {
    file: "midterm-summer.pdf",
    exam: "Midterm 1",
    term: "Summer",
    problems: [
      p(10, "Evaluate each limit. If a limit does not exist, explain why.",
        [5, "$\\displaystyle \\lim_{x \\to 1} \\frac{\\sqrt{x} - 1}{x - 1}$"],
        [5, "$\\displaystyle \\lim_{x \\to 0} \\frac{1 - \\cos x}{x^2}$"]),
      p(12, "Differentiate each function. You do not need to simplify your answers.",
        [4, "$f(x) = x^4 \\ln x$"],
        [4, "$g(x) = \\dfrac{\\sin x}{1 + \\cos x}$"],
        [4, "$h(x) = e^{x^2 + 3x}$"]),
      p(10, "Consider the curve defined by $x^3 + y^3 = 9$.",
        [6, "Use implicit differentiation to find $\\dfrac{dy}{dx}$."],
        [4, "Find an equation of the tangent line to the curve at the point $(1, 2)$."]),
      p(8, "Water drains from a conical tank, vertex down, with height $6$ m and top radius $3$ m, at a constant rate of $2\\ \\text{m}^3/\\text{min}$.",
        [5, "How fast is the water level falling at the instant when the water is $4$ m deep?"],
        [3, "State the units of your answer and explain in one sentence what its sign means."]),
      p(10, "Consider the line $y = 2x + 1$ and the point $(4, 1)$.",
        [4, "Write the square of the distance from $(4, 1)$ to a point on the line as a function of $x$."],
        [6, "Find the point on the line closest to $(4, 1)$. Justify that your answer is a minimum."]),
    ],
  },
];
