import { ICommand } from '../../../../core/mediator/interfaces';
import { UpdateCategoryRequest } from '../../models/category.model';

/** Mirrors UpdateCategoryCommand from the .NET Application layer */
export class UpdateCategoryCommand implements ICommand<void> {
  constructor(public readonly payload: UpdateCategoryRequest) {}
}
