import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../../../core/http/api.service';
import { HttpCacheService } from '../../../../core/http/http-cache.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { Result } from '../../../../core/models/result.model';
import { DeleteBrandCommand } from './delete-brand.command';

@Injectable({ providedIn: 'root' })
export class DeleteBrandHandler
  implements IRequestHandler<DeleteBrandCommand, void>
{
  private readonly api   = inject(ApiService);
  private readonly cache = inject(HttpCacheService);

  handle(request: DeleteBrandCommand): Observable<Result<void>> {
    return this.api.delete<void>(`/brands/${request.id}`).pipe(
      tap(result => { if (result.isSuccess) this.cache.invalidate('brands:'); }),
    );
  }
}
