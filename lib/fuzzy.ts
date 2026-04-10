export function fuzzyScore(candidate: string, query: string) {
  const target = candidate.toLowerCase();
  const search = query.trim().toLowerCase();

  if (!search) {
    return 1;
  }

  if (target.includes(search)) {
    return 100 - (target.length - search.length);
  }

  let score = 0;
  let cursor = 0;

  for (const letter of search) {
    const nextIndex = target.indexOf(letter, cursor);
    if (nextIndex === -1) {
      return -1;
    }

    score += nextIndex === cursor ? 8 : 3;
    cursor = nextIndex + 1;
  }

  return score - Math.max(0, target.length - search.length);
}

