import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../../../core/http/api.service';
import { HttpCacheService } from '../../../../core/http/http-cache.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { PagedResponse } from '../../../../core/models/paged-response.model';
import { Result } from '../../../../core/models/result.model';
import { CategoryDto } from '../../models/category.model';
import { GetAllCategoriesQuery } from './get-all-categories.query';

/** Cache TTL for category lookups (dropdown / stats). */
const CACHE_TTL_MS = 60_000;

/**
 * Handler for GetAllCategoriesQuery.
 * Calls GET /categories?page=&pageSize=&search=&status=&sortField=&sortOrder=
 *
 * Responses are cached for 60 s when used as a dropdown (pageSize ≥ 50, no search,
 * no filters, no sort). This avoids redundant requests when the category dropdown
 * is loaded by multiple pages in the same session.
 */
@Injectable({ providedIn: 'root' })
export class GetAllCategoriesHandler
  implements IRequestHandler<GetAllCategoriesQuery, PagedResponse<CategoryDto>>
{
  private readonly api   = inject(ApiService);
  private readonly cache = inject(HttpCacheService);

  handle(request: GetAllCategoriesQuery): Observable<Result<PagedResponse<CategoryDto>>> {
    const params = this._buildParams(request);
    const cacheKey = `categories:${JSON.stringify(params)}`;

    // Only cache stable dropdown requests (large page, no search/filter/sort)
    const isCacheable =
      request.pageSize >= 50 &&
      !request.search &&
      (!request.statuses || request.statuses.length === 0) &&
      !request.sortField;

    if (isCacheable) {
      const hit = this.cache.get<PagedResponse<CategoryDto>>(cacheKey);
      if (hit) return of(Result.success(hit));
    }

    return this.api.get<PagedResponse<CategoryDto>>('/categories', params).pipe(
      tap(result => {
        if (isCacheable && result.isSuccess && result.value) {
          this.cache.set(cacheKey, result.value, CACHE_TTL_MS);
        }
      }),
    );
  }

  private _buildParams(request: GetAllCategoriesQuery): Record<string, string | number> {
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
