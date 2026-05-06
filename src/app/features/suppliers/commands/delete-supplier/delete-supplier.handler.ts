import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { IRequestHandler } from '@core/mediator/interfaces';
import { Result } from '@core/models/result.model';
import { DeleteSupplierCommand } from './delete-supplier.command';

@Injectable({ providedIn: 'root' })
export class DeleteSupplierHandler
  implements IRequestHandler<DeleteSupplierCommand, void>
{
  private readonly api = inject(ApiService);

  handle(request: DeleteSupplierCommand): Observable<Result<void>> {
    return this.api.delete<void>(`/suppliers/${request.id}`);
  }
}
