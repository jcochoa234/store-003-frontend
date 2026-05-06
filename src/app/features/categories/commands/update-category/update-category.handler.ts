import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../../../core/http/api.service';
import { HttpCacheService } from '../../../../core/http/http-cache.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { Result } from '../../../../core/models/result.model';
import { UpdateCategoryCommand } from './update-category.command';

/**
 * Handler for UpdateCategoryCommand.
 * Calls PUT /categories/{id} with the full command body (including id).
 *
 * The API controller validates: if (id != command.Id) return BadRequest()
 * so the body MUST include the id field.
 */
@Injectable({ providedIn: 'root' })
export class UpdateCategoryHandler
  implements IRequestHandler<UpdateCategoryCommand, void>
{
  private readonly api   = inject(ApiService);
  private readonly cache = inject(HttpCacheService);

  handle(request: UpdateCategoryCommand): Observable<Result<void>> {
    return this.api.put<void>(`/categories/${request.payload.id}`, request.payload).pipe(
      tap(result => { if (result.isSuccess) this.cache.invalidate('categories:'); }),
    );
  }
}
