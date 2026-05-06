import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../../../core/http/api.service';
import { HttpCacheService } from '../../../../core/http/http-cache.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { Result } from '../../../../core/models/result.model';
import { CreateBrandCommand } from './create-brand.command';

@Injectable({ providedIn: 'root' })
export class CreateBrandHandler
  implements IRequestHandler<CreateBrandCommand, string>
{
  private readonly api   = inject(ApiService);
  private readonly cache = inject(HttpCacheService);

  handle(request: CreateBrandCommand): Observable<Result<string>> {
    return this.api.post<string>('/brands', request.payload).pipe(
      tap(result => { if (result.isSuccess) this.cache.invalidate('brands:'); }),
    );
  }
}
