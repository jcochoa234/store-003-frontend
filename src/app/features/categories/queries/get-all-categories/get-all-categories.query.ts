import { IQuery } from '../../../../core/mediator/interfaces';
import { PagedResponse } from '../../../../core/models/paged-response.model';
import { StatusDataPolicy } from '../../../../core/models/status-data-policy.enum';
import { CategoryDto } from '../../models/category.model';

/**
 * Query to retrieve a paginated list of categories.
 * Mirrors GetAllCategoriesQuery from the .NET Application layer.
 */
export class GetAllCategoriesQuery implements IQuery<PagedResponse<CategoryDto>> {
  constructor(
    public readonly page: number = 1,
    public readonly pageSize: number = 100,
    public readonly search?: string,
    public readonly statuses?: StatusDataPolicy[],
    public readonly sortField?: string,
    public readonly sortOrder?: 'ascend' | 'descend' | null,
  ) {}
}
