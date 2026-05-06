import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { IRequestHandler } from '@core/mediator/interfaces';
import { Result } from '@core/models/result.model';
import { GetSupplierByIdQuery } from './get-supplier-by-id.query';
import { SupplierDto } from '../../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class GetSupplierByIdHandler
  implements IRequestHandler<GetSupplierByIdQuery, SupplierDto>
{
  private readonly api = inject(ApiService);

  handle(request: GetSupplierByIdQuery): Observable<Result<SupplierDto>> {
    return this.api.get<SupplierDto>(`/suppliers/${request.id}`);
  }
}
