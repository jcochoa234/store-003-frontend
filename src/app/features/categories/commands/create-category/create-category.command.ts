import { ICommand } from '../../../../core/mediator/interfaces';
import { CreateCategoryRequest } from '../../models/category.model';

/**
 * Command to create a new category.
 * Mirrors CreateCategoryCommand from the .NET Application layer.
 * Returns the newly created category's ID (string/Guid).
 */
export class CreateCategoryCommand implements ICommand<string> {
  constructor(public readonly payload: CreateCategoryRequest) {}
}
