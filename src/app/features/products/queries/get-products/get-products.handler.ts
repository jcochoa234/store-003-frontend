import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { PagedResponse } from '../../../../core/models/paged-response.model';
import { Result } from '../../../../core/models/result.model';
import { ProductDto } from '../../models/product.model';
import { GetProductsQuery } from './get-products.query';

/**
 * Handler for GetProductsQuery.
 * Calls GET /products?page=&pageSize=&search=&categoryId=&minPrice=&maxPrice=&status=&sortField=&sortOrder=
 */
@Injectable({ providedIn: 'root' })
export class GetProductsHandler
  implements IRequestHandler<GetProductsQuery, PagedResponse<ProductDto>>
{
  private readonly api = inject(ApiService);

  handle(request: GetProductsQuery): Observable<Result<PagedResponse<ProductDto>>> {
    const p = request.params;
    const params: Record<string, string | number> = {
      page: p.page,
      pageSize: p.pageSize,
    };
    if (p.search)                                   params['search']     = p.search;
    if (p.categoryIds && p.categoryIds.length > 0)  params['categoryId'] = p.categoryIds.join(',');
    if (p.brandIds && p.brandIds.length > 0)        params['brandId']    = p.brandIds.join(',');
    if (p.minPrice != null)             params['minPrice']   = p.minPrice;
    if (p.maxPrice != null)             params['maxPrice']   = p.maxPrice;
    if (p.statuses && p.statuses.length > 0) params['status'] = p.statuses.join(',');
    if (p.sortField && p.sortOrder)     {
      params['sortField'] = p.sortField;
      params['sortOrder'] = p.sortOrder === 'ascend' ? 'asc' : 'desc';
    }
    return this.api.get<PagedResponse<ProductDto>>('/products', params);
  }
}
