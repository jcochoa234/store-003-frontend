import { ICommand } from '../../../../core/mediator/interfaces';

/** Mirrors DeleteBrandCommand from the .NET Application layer */
export class DeleteBrandCommand implements ICommand<void> {
  constructor(public readonly id: string) {}
}
