import { StatusDataPolicy } from '../../../core/models/status-data-policy.enum';

/**
 * Mirrors CategoryDto from the .NET Application layer exactly.
 * record CategoryDto(Guid Id, string Name, string Description, StatusDataPolicy Status)
 */
export interface CategoryDto {
  id: string;
  name: string;
  description: string;
  status?: StatusDataPolicy;
}

/** Payload for creating a category — mirrors CreateCategoryCommand */
export interface CreateCategoryRequest {
  name: string;
  description: string;
  status: StatusDataPolicy;
}

/** Payload for updating a category — mirrors UpdateCategoryCommand */
export interface UpdateCategoryRequest {
  id: string;
  name: string;
  description: string;
  status: StatusDataPolicy;
}
