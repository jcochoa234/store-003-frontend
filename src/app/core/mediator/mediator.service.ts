import { Injectable, Type, inject, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { Result } from '../models/result.model';
import { IRequestHandler } from './interfaces';

/**
 * Central CQRS mediator — dispatches Commands and Queries to their registered handlers.
 * Mirrors the custom Mediator.cs from the .NET Application layer.
 *
 * Usage:
 *   mediator.send(new GetProductsQuery({ page: 1, pageSize: 10 }), GetProductsHandler)
 */
@Injectable({ providedIn: 'root' })
export class MediatorService {
  private readonly injector = inject(Injector);

  /**
   * Dispatches a request to its handler and returns an Observable<Result<TResponse>>.
   *
   * @param request  The command or query instance
   * @param handler  The handler class (Angular service) registered in DI
   */
  send<TRequest, TResponse>(
    request: TRequest,
    handler: Type<IRequestHandler<TRequest, TResponse>>
  ): Observable<Result<TResponse>> {
    const handlerInstance = this.injector.get(handler);
    return handlerInstance.handle(request);
  }
}
