import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../../../core/http/api.service';
import { HttpCacheService } from '../../../../core/http/http-cache.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { PagedResponse } from '../../../../core/models/paged-response.model';
import { Result } from '../../../../core/models/result.model';
import { BrandDto } from '../../models/brand.model';
import { GetBrandsQuery } from './get-brands.query';

/** Cache TTL for brand lookups (dropdown). */
const CACHE_TTL_MS = 60_000;

/**
 * Handler for GetBrandsQuery.
 * Calls GET /brands?page=&pageSize=&search=&status=&sortField=&sortOrder=
 *
 * Caches stable dropdown requests (large page, no search/filter/sort) for 60 s.
 */
@Injectable({ providedIn: 'root' })
export class GetBrandsHandler
  implements IRequestHandler<GetBrandsQuery, PagedResponse<BrandDto>>
{
  private readonly api   = inject(ApiService);
  private readonly cache = inject(HttpCacheService);

  handle(request: GetBrandsQuery): Observable<Result<PagedResponse<BrandDto>>> {
    const params = this._buildParams(request);
    const cacheKey = `brands:${JSON.stringify(params)}`;

    const isCacheable =
      request.pageSize >= 50 &&
      !request.search &&
      (!request.statuses || request.statuses.length === 0) &&
      !request.sortField;

    if (isCacheable) {
      const hit = this.cache.get<PagedResponse<BrandDto>>(cacheKey);
      if (hit) return of(Result.success(hit));
    }

    return this.api.get<PagedResponse<BrandDto>>('/brands', params).pipe(
      tap(result => {
        if (isCacheable && result.isSuccess && result.value) {
          this.cache.set(cacheKey, result.value, CACHE_TTL_MS);
        }
      }),
    );
  }

  private _buildParams(request: GetBrandsQuery): Record<string, string | number> {
    const params: Record<string, string | number> = {
      page:     request.page,
      pageSize: request.pageSize,
    };
    if (request.search)                                  params['search']    = request.search;
    if (request.statuses && request.statuses.length > 0) params['status']    = request.statuses.join(',');
    if (request.sortField && request.sortOrder) {
      params['sortField'] = request.sortField;
      params['sortOrder'] = request.sortOrder === 'ascend' ? 'asc' : 'desc';
    }
    return params;
  }
}
