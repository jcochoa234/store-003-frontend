import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../../../core/http/api.service';
import { HttpCacheService } from '../../../../core/http/http-cache.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { Result } from '../../../../core/models/result.model';
import { CreateCategoryCommand } from './create-category.command';

/**
 * Handler for CreateCategoryCommand.
 * Calls POST /categories and returns Result<string> (the new ID).
 * Invalidates the category cache on success.
 */
@Injectable({ providedIn: 'root' })
export class CreateCategoryHandler
  implements IRequestHandler<CreateCategoryCommand, string>
{
  private readonly api   = inject(ApiService);
  private readonly cache = inject(HttpCacheService);

  handle(request: CreateCategoryCommand): Observable<Result<string>> {
    return this.api.post<string>('/categories', request.payload).pipe(
      tap(result => { if (result.isSuccess) this.cache.invalidate('categories:'); }),
    );
  }
}
