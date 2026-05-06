import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../../../core/http/api.service';
import { HttpCacheService } from '../../../../core/http/http-cache.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { Result } from '../../../../core/models/result.model';
import { DeleteCategoryCommand } from './delete-category.command';

@Injectable({ providedIn: 'root' })
export class DeleteCategoryHandler
  implements IRequestHandler<DeleteCategoryCommand, void>
{
  private readonly api   = inject(ApiService);
  private readonly cache = inject(HttpCacheService);

  handle(request: DeleteCategoryCommand): Observable<Result<void>> {
    return this.api.delete<void>(`/categories/${request.id}`).pipe(
      tap(result => { if (result.isSuccess) this.cache.invalidate('categories:'); }),
    );
  }
}
