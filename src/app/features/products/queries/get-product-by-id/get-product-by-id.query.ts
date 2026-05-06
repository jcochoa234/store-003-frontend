import { IQuery } from '../../../../core/mediator/interfaces';
import { ProductDto } from '../../models/product.model';

/** Mirrors GetProductByIdQuery from the .NET Application layer */
export class GetProductByIdQuery implements IQuery<ProductDto> {
  constructor(public readonly id: string) {}
}
