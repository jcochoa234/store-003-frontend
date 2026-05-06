import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { tap } from 'rxjs';

const CORRELATION_ID_HEADER = 'X-Correlation-ID';

function generateCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Generates and attaches X-Correlation-ID to every request for end-to-end tracing.
 * Mirrors the CorrelationIdMiddleware from the .NET API.
 */
export const correlationIdInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const correlationId = generateCorrelationId();

  const tracedReq = req.clone({
    setHeaders: { [CORRELATION_ID_HEADER]: correlationId },
  });

  return next(tracedReq).pipe(
    tap((event) => {
      // Log correlation ID for debugging in development
      if (typeof window !== 'undefined' && !('production' in window)) {
        console.debug(`[${correlationId}] ${req.method} ${req.url}`);
      }
    })
  );
};
