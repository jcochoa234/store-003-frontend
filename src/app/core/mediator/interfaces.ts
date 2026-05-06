import { Observable } from 'rxjs';
import { Result } from '../models/result.model';

/**
 * Marker interface for all requests (Commands and Queries).
 * Mirrors IRequest<TResponse> from the .NET mediator.
 * Empty by design — structural typing is enforced by IRequestHandler.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IRequest<_TResponse = unknown> {}

/**
 * Handler interface for processing a request.
 * Mirrors IRequestHandler<TRequest, TResponse>.
 */
export interface IRequestHandler<TRequest, TResponse> {
  handle(request: TRequest): Observable<Result<TResponse>>;
}

/**
 * Marker interface for commands (mutations).
 * Commands return Result<TResponse> where TResponse is typically void or an ID.
 */
export interface ICommand<TResponse = void> extends IRequest<TResponse> {}

/**
 * Marker interface for queries (reads).
 * Queries return Result<TResponse> where TResponse is a DTO or paged list.
 */
export interface IQuery<TResponse> extends IRequest<TResponse> {}

/** Token used to register handlers with the mediator */
export const HANDLER_TOKEN = 'CQRS_HANDLER';
