import { AppError, ErrorType } from './error.model';

/**
 * Mirrors the Result<T> pattern from the .NET backend.
 * Encapsulates either a successful value or a failure with an AppError.
 */
export class Result<T> {
  readonly isSuccess: boolean;
  readonly isFailure: boolean;
  readonly value: T | null;
  readonly error: AppError | null;

  private constructor(isSuccess: boolean, value: T | null, error: AppError | null) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.value = value;
    this.error = error;
  }

  static success<T>(value: T): Result<T> {
    return new Result<T>(true, value, null);
  }

  static failure<T>(error: AppError): Result<T> {
    return new Result<T>(false, null, error);
  }

  /** Pattern-match on success/failure — mirrors .Match() extension in .NET */
  match<TResult>(
    onSuccess: (value: T) => TResult,
    onFailure: (error: AppError) => TResult
  ): TResult {
    if (this.isSuccess) {
      return onSuccess(this.value as T);
    }
    return onFailure(this.error ?? { code: 'Unknown', message: 'Unknown error', type: ErrorType.Failure });
  }
}
