import { ICommand } from '../../../../core/mediator/interfaces';
import { CreateProductRequest } from '../../models/product.model';

/**
 * Command to create a new product.
 * Mirrors CreateProductCommand from the .NET Application layer.
 * Returns the newly created product's ID.
 */
export class CreateProductCommand implements ICommand<string> {
  constructor(public readonly payload: CreateProductRequest) {}
}
