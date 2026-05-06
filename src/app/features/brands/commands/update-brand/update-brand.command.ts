import { ICommand } from '../../../../core/mediator/interfaces';
import { UpdateBrandRequest } from '../../models/brand.model';

/** Mirrors UpdateBrandCommand from the .NET Application layer */
export class UpdateBrandCommand implements ICommand<void> {
  constructor(public readonly payload: UpdateBrandRequest) {}
}
