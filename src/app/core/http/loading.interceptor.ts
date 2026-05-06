import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { HttpLoadingService } from './http-loading.service';

/**
 * Tracks in-flight HTTP requests and updates HttpLoadingService.
 * Drives the global top progress bar in main-layout.
 */
export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const loading = inject(HttpLoadingService);
  loading.start();
  return next(req).pipe(finalize(() => loading.end()));
};
