import { IQuery } from '../../../../core/mediator/interfaces';
import { CategoryDto } from '../../models/category.model';

/** Mirrors GetCategoryByIdQuery from the .NET Application layer */
export class GetCategoryByIdQuery implements IQuery<CategoryDto> {
  constructor(public readonly id: string) {}
}
