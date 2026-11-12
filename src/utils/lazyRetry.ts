import { type ComponentType, lazy, type LazyExoticComponent } from 'react';

/**
 * Resilient lazy dynamic importer that catches chunk-load failures
 * (common when a new deployment invalidates old asset hashes while a user has the page open).
 * Automatically attempts a reload to fetch the latest application bundle.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | T>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await factory();
      return 'default' in module ? module : { default: module as T };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const isChunkError =
        msg.includes('dynamically imported module') ||
        msg.includes('Failed to fetch') ||
        msg.includes('error loading dynamically imported module') ||
        msg.includes('Importing a module script failed');

      if (isChunkError) {
        const storageKey = 'fc_chunk_retry_' + window.location.pathname;
        const lastReload = sessionStorage.getItem(storageKey);
        const now = Date.now();
        if (!lastReload || now - Number(lastReload) > 10000) {
          sessionStorage.setItem(storageKey, String(now));
          window.location.reload();
          // Never resolve so React waits for page reload rather than rendering an error
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw error;
    }
  });
}
