
export function fuzzyScore(query: string, text: string): number | null {
  if (!query) return 0;
  if (!text) return null;

  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  let score = 0;
  let lastMatch = -2;
  let run = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] !== q[qi]) continue;
    let bonus = 1;
    const prev = ti > 0 ? text[ti - 1] : "";
    if (ti === 0 || /[\s\-_/.]/.test(prev)) bonus += 4;
    else if (prev && prev !== prev.toLowerCase()) bonus += 0;
    else if (text[ti] !== text[ti].toLowerCase()) bonus += 3;
    if (lastMatch === ti - 1) { run += 2; bonus += run; }
    else run = 0;
    score += bonus;
    lastMatch = ti;
    qi++;
  }
  return qi === q.length ? score : null;
}

export interface ScoredSnippet<T> {
  item: T;
  score: number;
}

export interface FuzzyFields {
  title: string;
  tags: string[];
  description: string;
  body: string;
}


export function scoreSnippet(query: string, fields: FuzzyFields): number | null {
  const t = fuzzyScore(query, fields.title);
  const d = fuzzyScore(query, fields.description);
  const b = fuzzyScore(query, fields.body);
  let bestTag: number | null = null;
  for (const tag of fields.tags) {
    const s = fuzzyScore(query, tag);
    if (s !== null && (bestTag === null || s > bestTag)) bestTag = s;
  }

  const components = [
    t !== null ? t * 4 : null,
    bestTag !== null ? bestTag * 3 : null,
    d !== null ? d * 1.5 : null,
    b !== null ? b * 0.5 : null,
  ].filter((x): x is number => x !== null);

  if (components.length === 0) return null;
  return components.reduce((a, b) => a + b, 0);
}

export function rankSnippets<T extends FuzzyFields>(
  query: string,
  items: T[]
): ScoredSnippet<T>[] {
  const out: ScoredSnippet<T>[] = [];
  for (const item of items) {
    const score = scoreSnippet(query, item);
    if (score !== null) out.push({ item, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}
