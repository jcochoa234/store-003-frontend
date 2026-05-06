import { ICommand } from '../../../../core/mediator/interfaces';

/** Mirrors DeleteProductCommand from the .NET Application layer */
export class DeleteProductCommand implements ICommand<void> {
  constructor(public readonly id: string) {}
}
