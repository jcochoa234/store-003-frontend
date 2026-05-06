import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory HTTP response cache with TTL support.
 *
 * Usage in a handler:
 *   const cached = this.cache.get<PagedResponse<CategoryDto>>(key);
 *   if (cached) return of(Result.success(cached));
 *   return this.api.get(...).pipe(
 *     tap(r => r.isSuccess && this.cache.set(key, r.value!, 60_000))
 *   );
 *
 * Invalidation — call from Create/Update/Delete handlers:
 *   this.cache.invalidate('categories:');
 */
@Injectable({ providedIn: 'root' })
export class HttpCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  /** Returns the cached value or null if missing / expired. */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  /** Stores a value with the given TTL (default 60 s). */
  set<T>(key: string, value: T, ttlMs = 60_000): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Removes all entries whose key starts with the given prefix. */
  invalidate(keyPrefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(keyPrefix)) this.store.delete(key);
    }
  }
}
