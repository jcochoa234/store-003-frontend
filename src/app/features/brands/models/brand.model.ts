import { PagedQuery } from '../../../core/models/paged-response.model';
import { StatusDataPolicy } from '../../../core/models/status-data-policy.enum';

/**
 * Mirrors BrandDto from the .NET Application layer exactly.
 * record BrandDto(Guid Id, string Name, string Slug, string? Description, StatusDataPolicy Status)
 */
export interface BrandDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status?: StatusDataPolicy;
}

/** Payload for creating a brand — mirrors CreateBrandCommand */
export interface CreateBrandRequest {
  name: string;
  slug: string;
  description?: string;
  status: StatusDataPolicy;
}

/** Payload for updating a brand — mirrors UpdateBrandCommand */
export interface UpdateBrandRequest {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: StatusDataPolicy;
}

/** Mirrors GetBrandsQuery — pagination + optional filters + sorting */
export interface GetBrandsRequest extends PagedQuery {
  search?: string;
  statuses?: StatusDataPolicy[];
  sortField?: string;
  sortOrder?: 'ascend' | 'descend' | null;
}
