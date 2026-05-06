import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { Result } from '../../../../core/models/result.model';
import { ProductDto } from '../../models/product.model';
import { GetProductByIdQuery } from './get-product-by-id.query';

@Injectable({ providedIn: 'root' })
export class GetProductByIdHandler
  implements IRequestHandler<GetProductByIdQuery, ProductDto>
{
  private readonly api = inject(ApiService);

  handle(request: GetProductByIdQuery): Observable<Result<ProductDto>> {
    return this.api.get<ProductDto>(`/products/${request.id}`);
  }
}
