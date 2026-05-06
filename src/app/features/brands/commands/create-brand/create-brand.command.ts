import { ICommand } from '../../../../core/mediator/interfaces';
import { CreateBrandRequest } from '../../models/brand.model';

/**
 * Command to create a new brand.
 * Mirrors CreateBrandCommand from the .NET Application layer.
 * Returns the newly created brand's ID (string/Guid).
 */
export class CreateBrandCommand implements ICommand<string> {
  constructor(public readonly payload: CreateBrandRequest) {}
}
