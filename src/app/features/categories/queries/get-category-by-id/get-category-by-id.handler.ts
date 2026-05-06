import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { PagedResponse } from '../../../../core/models/paged-response.model';
import { AppErrors, ErrorType } from '../../../../core/models/error.model';
import { Result } from '../../../../core/models/result.model';
import { CategoryDto } from '../../models/category.model';
import { GetCategoryByIdQuery } from './get-category-by-id.query';

/**
 * The API does not expose a GET /categories/{id} endpoint.
 * This handler fetches a page of categories and filters by id locally.
 * Since categories are few in a typical dataset, pageSize:100 is sufficient.
 */
@Injectable({ providedIn: 'root' })
export class GetCategoryByIdHandler
  implements IRequestHandler<GetCategoryByIdQuery, CategoryDto>
{
  private readonly api = inject(ApiService);

  handle(request: GetCategoryByIdQuery): Observable<Result<CategoryDto>> {
    return this.api
      .get<PagedResponse<CategoryDto>>('/categories', { page: 1, pageSize: 100 })
      .pipe(
        map((result) =>
          result.match(
            (paged) => {
              const found = paged.items.find((c) => c.id === request.id);
              return found
                ? Result.success(found)
                : Result.failure<CategoryDto>(
                    AppErrors.notFound('Category')
                  );
            },
            (error) => Result.failure<CategoryDto>(error)
          )
        )
      );
  }
}
