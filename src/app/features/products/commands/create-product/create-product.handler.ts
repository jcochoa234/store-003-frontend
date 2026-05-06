import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { Result } from '../../../../core/models/result.model';
import { CreateProductCommand } from './create-product.command';

@Injectable({ providedIn: 'root' })
export class CreateProductHandler
  implements IRequestHandler<CreateProductCommand, string>
{
  private readonly api = inject(ApiService);

  handle(request: CreateProductCommand): Observable<Result<string>> {
    return this.api.post<string>('/products', request.payload);
  }
}
