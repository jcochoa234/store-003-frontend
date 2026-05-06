import { Injectable, signal } from '@angular/core';

/**
 * Tracks active HTTP requests and exposes a loading signal.
 * Used by loadingInterceptor to show/hide the global progress bar.
 */
@Injectable({ providedIn: 'root' })
export class HttpLoadingService {
  private _activeRequests = 0;
  readonly isLoading = signal(false);

  start(): void {
    this._activeRequests++;
    this.isLoading.set(true);
  }

  end(): void {
    this._activeRequests = Math.max(0, this._activeRequests - 1);
    if (this._activeRequests === 0) {
      this.isLoading.set(false);
    }
  }
}
