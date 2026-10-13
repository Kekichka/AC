export const RRF_K = 60;

export function rrf(lists: readonly (readonly string[])[], k = RRF_K): { id: string; score: number }[] {
  const total = new Map<string, number>();
  for (const list of lists) {
    list.forEach((id, i) => {
      total.set(id, (total.get(id) ?? 0) + 1 / (k + i + 1));
    });
  }
  return [...total.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}