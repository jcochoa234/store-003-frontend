import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '@environments/environment';
import { AppErrors, ErrorType } from '../models/error.model';
import { Result } from '../models/result.model';

/**
 * API error body shape returned by ApiController.HandleFailure:
 *   { "error": "Product.NotFound", "message": "Product not found." }
 *
 * ProblemDetails shape (validation / unhandled errors):
 *   { "title": "...", "errors": { "Name": ["..."] } }
 */
interface ApiErrorBody {
  error?: string;
  message?: string;
  title?: string;
}

/**
 * Base HTTP service. All methods return Observable<Result<T>>.
 * HTTP errors are mapped to Result.failure(AppError) so components
 * never need to catch HTTP exceptions manually.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  protected readonly baseUrl = environment.apiUrl;

  get<T>(path: string, params?: Record<string, string | number>): Observable<Result<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          httpParams = httpParams.set(k, String(v));
        }
      });
    }
    return this.http
      .get<T>(`${this.baseUrl}${path}`, { params: httpParams })
      .pipe(
        map((data) => Result.success<T>(data)),
        catchError((err) => [this._mapError<T>(err)])
      );
  }

  post<T>(path: string, body: unknown): Observable<Result<T>> {
    return this.http
      .post<T>(`${this.baseUrl}${path}`, body)
      .pipe(
        map((data) => Result.success<T>(data)),
        catchError((err) => [this._mapError<T>(err)])
      );
  }

  put<T>(path: string, body: unknown): Observable<Result<T>> {
    return this.http
      .put<T>(`${this.baseUrl}${path}`, body, { observe: 'response' })
      .pipe(
        map((response) =>
          response.status === 204
            ? Result.success<T>(null as T)
            : Result.success<T>(response.body as T)
        ),
        catchError((err) => [this._mapError<T>(err)])
      );
  }

  delete<T>(path: string): Observable<Result<T>> {
    return this.http
      .delete<T>(`${this.baseUrl}${path}`, { observe: 'response' })
      .pipe(
        map((response) =>
          response.status === 204
            ? Result.success<T>(null as T)
            : Result.success<T>(response.body as T)
        ),
        catchError((err) => [this._mapError<T>(err)])
      );
  }

  /**
   * Maps an HttpErrorResponse to a Result.failure(AppError).
   * Handles both ApiController.HandleFailure format { error, message }
   * and RFC 7807 ProblemDetails format { title }.
   */
  private _mapError<T>(err: { status: number; error?: ApiErrorBody }): Result<T> {
    const body = err.error;
    // Prefer the business message from { error, message }, fallback to ProblemDetails title
    const message = body?.message ?? body?.title ?? AppErrors.unknown().message;
    const code = body?.error ?? 'Unknown';
    const status = err.status;

    if (status === 404) {
      return Result.failure<T>({ code, message, type: ErrorType.NotFound });
    }
    if (status === 409) {
      return Result.failure<T>({ code, message, type: ErrorType.Conflict });
    }
    if (status === 400) {
      return Result.failure<T>({ code, message, type: ErrorType.Validation });
    }
    return Result.failure<T>({ code, message, type: ErrorType.Failure });
  }
}
