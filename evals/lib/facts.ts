import type { PlantedFact } from "./packs";

const WINDOW = 500;

/** Lower-case, fold look-alike characters and drop all whitespace, so "n − 1" and "n-1" compare equal. */
export function squash(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‐-―−]/g, "-")
    .replace(/[×⋅·]/g, "*")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, "");
}

function positions(haystack: string, needle: string): number[] {
  const found: number[] = [];
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) found.push(at);
  return found;
}

/** True when every needle group appears within one window of squashed text. */
export function factSurvives(fact: Pick<PlantedFact, "needles">, extractedText: string): boolean {
  const haystack = squash(extractedText);
  const groups = fact.needles.map((group) => group.map(squash).filter((n) => n.length > 0));
  const [first, ...rest] = groups;
  if (!first || first.length === 0) return false;
  const anchors = first.flatMap((needle) => positions(haystack, needle));
  return anchors.some((anchor) => {
    const window = haystack.slice(Math.max(0, anchor - WINDOW), anchor + WINDOW);
    return rest.every((group) => group.some((needle) => window.includes(needle)));
  });
}
