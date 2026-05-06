import { IQuery } from '@core/mediator/interfaces';
import { PagedResponse } from '@core/models/paged-response.model';
import { GetSuppliersRequest, SupplierDto } from '../../models/supplier.model';

export class GetSuppliersQuery implements IQuery<PagedResponse<SupplierDto>> {
  constructor(public readonly params: GetSuppliersRequest) {}
}
