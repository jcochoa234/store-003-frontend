import { ICommand } from '../../../../core/mediator/interfaces';

/** Mirrors DeleteCategoryCommand from the .NET Application layer */
export class DeleteCategoryCommand implements ICommand<void> {
  constructor(public readonly id: string) {}
}
