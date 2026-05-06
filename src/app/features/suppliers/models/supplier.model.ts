import { PagedQuery } from '@core/models/paged-response.model';
import { StatusDataPolicy } from '@core/models/status-data-policy.enum';

/** Mirrors SupplierDto from the .NET Application layer */
export interface SupplierDto {
  id: string;
  name: string;
  contactEmail: string;
  phone: string;
  status?: StatusDataPolicy;
}

/** Mirrors CreateSupplierCommand — sent as the full request body */
export interface CreateSupplierRequest {
  name: string;
  contactEmail: string;
  phone: string;
  status: StatusDataPolicy;
}

/** Mirrors UpdateSupplierCommand */
export interface UpdateSupplierRequest {
  id: string;
  name: string;
  contactEmail: string;
  phone: string;
  status: StatusDataPolicy;
}

/** Mirrors GetSuppliersQuery — pagination + optional filters */
export interface GetSuppliersRequest extends PagedQuery {
  search?: string;
  statuses?: StatusDataPolicy[];
  sortField?: string;
  sortOrder?: 'ascend' | 'descend' | null;
}
