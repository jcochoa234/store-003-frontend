import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { IRequestHandler } from '@core/mediator/interfaces';
import { Result } from '@core/models/result.model';
import { PagedResponse } from '@core/models/paged-response.model';
import { GetSuppliersQuery } from './get-suppliers.query';
import { SupplierDto } from '../../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class GetSuppliersHandler
  implements IRequestHandler<GetSuppliersQuery, PagedResponse<SupplierDto>>
{
  private readonly api = inject(ApiService);

  handle(request: GetSuppliersQuery): Observable<Result<PagedResponse<SupplierDto>>> {
    return this.api.get<PagedResponse<SupplierDto>>('/suppliers', { ...request.params });
  }
}
