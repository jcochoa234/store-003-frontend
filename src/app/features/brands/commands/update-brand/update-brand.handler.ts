import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../../../core/http/api.service';
import { HttpCacheService } from '../../../../core/http/http-cache.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { Result } from '../../../../core/models/result.model';
import { UpdateBrandCommand } from './update-brand.command';

@Injectable({ providedIn: 'root' })
export class UpdateBrandHandler
  implements IRequestHandler<UpdateBrandCommand, void>
{
  private readonly api   = inject(ApiService);
  private readonly cache = inject(HttpCacheService);

  handle(request: UpdateBrandCommand): Observable<Result<void>> {
    return this.api.put<void>(`/brands/${request.payload.id}`, request.payload).pipe(
      tap(result => { if (result.isSuccess) this.cache.invalidate('brands:'); }),
    );
  }
}
