import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { Result } from '../../../../core/models/result.model';
import { DeleteProductCommand } from './delete-product.command';

@Injectable({ providedIn: 'root' })
export class DeleteProductHandler
  implements IRequestHandler<DeleteProductCommand, void>
{
  private readonly api = inject(ApiService);

  handle(request: DeleteProductCommand): Observable<Result<void>> {
    return this.api.delete<void>(`/products/${request.id}`);
  }
}
