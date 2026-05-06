import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { IRequestHandler } from '@core/mediator/interfaces';
import { Result } from '@core/models/result.model';
import { CreateSupplierCommand } from './create-supplier.command';

@Injectable({ providedIn: 'root' })
export class CreateSupplierHandler
  implements IRequestHandler<CreateSupplierCommand, string>
{
  private readonly api = inject(ApiService);

  handle(request: CreateSupplierCommand): Observable<Result<string>> {
    return this.api.post<string>('/suppliers', request.payload);
  }
}
