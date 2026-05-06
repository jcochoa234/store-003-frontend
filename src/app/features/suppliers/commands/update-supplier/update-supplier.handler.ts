import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { IRequestHandler } from '@core/mediator/interfaces';
import { Result } from '@core/models/result.model';
import { UpdateSupplierCommand } from './update-supplier.command';

@Injectable({ providedIn: 'root' })
export class UpdateSupplierHandler
  implements IRequestHandler<UpdateSupplierCommand, void>
{
  private readonly api = inject(ApiService);

  handle(request: UpdateSupplierCommand): Observable<Result<void>> {
    return this.api.put<void>(`/suppliers/${request.payload.id}`, request.payload);
  }
}
