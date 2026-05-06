import { IQuery } from '../../../../core/mediator/interfaces';
import { PagedResponse } from '../../../../core/models/paged-response.model';
import { GetProductsRequest, ProductDto } from '../../models/product.model';

/**
 * Query to retrieve a paginated list of products.
 * Mirrors GetProductsQuery from the .NET Application layer.
 */
export class GetProductsQuery implements IQuery<PagedResponse<ProductDto>> {
  constructor(public readonly params: GetProductsRequest) {}
}
