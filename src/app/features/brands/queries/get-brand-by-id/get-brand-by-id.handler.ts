import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { Result } from '../../../../core/models/result.model';
import { BrandDto } from '../../models/brand.model';
import { GetBrandByIdQuery } from './get-brand-by-id.query';

/**
 * Handler for GetBrandByIdQuery.
 * Calls GET /brands/{id}.
 */
@Injectable({ providedIn: 'root' })
export class GetBrandByIdHandler
  implements IRequestHandler<GetBrandByIdQuery, BrandDto>
{
  private readonly api = inject(ApiService);

  handle(request: GetBrandByIdQuery): Observable<Result<BrandDto>> {
    return this.api.get<BrandDto>(`/brands/${request.id}`);
  }
}
