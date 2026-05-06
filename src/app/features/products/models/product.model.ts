import { PagedQuery } from '../../../core/models/paged-response.model';
import { StatusDataPolicy } from '../../../core/models/status-data-policy.enum';

/**
 * Mirrors ProductDto from the .NET Application layer exactly.
 * record ProductDto(Guid Id, string Name, decimal Price, Guid CategoryId, Guid? BrandId, string? BrandName, StatusDataPolicy Status)
 */
export interface ProductDto {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  brandId?: string;
  brandName?: string;
  status?: StatusDataPolicy;
}

/** Mirrors CreateProductCommand — sent as the full request body */
export interface CreateProductRequest {
  name: string;
  price: number;
  categoryId: string;
  brandId?: string;
  status: StatusDataPolicy;
}

/**
 * Mirrors UpdateProductCommand — body must include `id` because the API validates
 * that the route param `{id}` matches `command.Id`.
 */
export interface UpdateProductRequest {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  brandId?: string;
  status: StatusDataPolicy;
}

/** Mirrors GetProductsQuery — pagination + optional filters + sorting */
export interface GetProductsRequest extends PagedQuery {
  search?: string;
  categoryIds?: string[];
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  statuses?: StatusDataPolicy[];
  sortField?: string;
  sortOrder?: 'ascend' | 'descend' | null;
}
