import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { EMPTY, catchError, throwError } from 'rxjs';
import { AppErrors } from '../models/error.model';

/**
 * API error response shape returned by ApiController.HandleFailure:
 *   { "error": "Product.NotFound", "message": "Product not found." }
 *
 * Validation errors from ExceptionHandlingMiddleware use RFC 7807 ProblemDetails:
 *   { "title": "...", "errors": { "Name": ["..."] } }
 */
interface ApiErrorBody {
  error?: string;
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
}

/** Extracts the most useful message from any API error response body */
function extractMessage(body: ApiErrorBody | null | undefined): string {
  if (!body) return AppErrors.unknown().message;
  // Business failures: { error, message }
  if (body.message) return body.message;
  // ProblemDetails (validation / unhandled exceptions): { title }
  if (body.title) return body.title;
  return AppErrors.unknown().message;
}

/**
 * Global HTTP error handler. Mirrors ExceptionHandlingMiddleware behavior.
 *
 * - 0 (network) → shows network error toast
 * - 401 → redirects to /unauthorized
 * - 403 → shows permission error + redirects to /unauthorized
 * - 400 → shows each validation error individually
 * - 404 / 409 → shows business error message
 * - 5xx → shows generic error message
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const message = inject(NzMessageService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        message.error(AppErrors.network().message);
        return throwError(() => error);
      }

      if (error.status === 401) {
        router.navigate(['/unauthorized']);
        return EMPTY;
      }

      if (error.status === 403) {
        message.error('You do not have permission to perform this action.');
        router.navigate(['/unauthorized']);
        return EMPTY;
      }

      const body = error.error as ApiErrorBody | null;

      // 400 with validation groups — from ExceptionHandlingMiddleware
      if (error.status === 400 && body?.errors) {
        const validationMessages = Object.values(body.errors).flat();
        validationMessages.forEach((msg) => message.error(msg));
        return throwError(() => error);
      }

      // 400/404/409 business failures — from ApiController.HandleFailure
      message.error(extractMessage(body));
      return throwError(() => error);
    })
  );
};
