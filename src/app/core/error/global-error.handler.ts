import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';

/**
 * Global error handler for uncaught exceptions outside the HTTP interceptor layer.
 * HTTP errors are already handled by errorInterceptor — this only catches the rest
 * (e.g. errors thrown in ngOnInit, unhandled Promise rejections, template errors).
 *
 * Uses lazy Injector injection to avoid the circular-dependency issue that arises
 * when ErrorHandler is provided before the full DI graph is ready.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  handleError(error: unknown): void {
    // HTTP errors are already surfaced by the errorInterceptor — skip them here
    if (error instanceof HttpErrorResponse) return;

    console.error('[GlobalErrorHandler]', error);

    // Lazy-resolve NzMessageService to avoid DI circular dependency at bootstrap
    setTimeout(() => {
      try {
        const message = this.injector.get(NzMessageService);
        const text = this._extractMessage(error);
        message.error(text, { nzDuration: 6000 });
      } catch {
        // Message service unavailable (e.g. during bootstrapping) — already logged above
      }
    });
  }

  private _extractMessage(error: unknown): string {
    if (error instanceof Error) return error.message || 'An unexpected error occurred.';
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred.';
  }
}
