import { LRUCache } from "lru-cache";

// Replace inflight usage with LRU Cache
const cache = new LRUCache<string, unknown>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function fetchWithCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = cache.get(key) as T | undefined;
  if (cached !== undefined) return cached;

  const result = await fetchFn();
  cache.set(key, result as unknown);
  return result;
}
