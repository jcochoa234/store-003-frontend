import { ICommand } from '../../../../core/mediator/interfaces';
import { UpdateProductRequest } from '../../models/product.model';

/** Mirrors UpdateProductCommand from the .NET Application layer */
export class UpdateProductCommand implements ICommand<void> {
  constructor(public readonly payload: UpdateProductRequest) {}
}
