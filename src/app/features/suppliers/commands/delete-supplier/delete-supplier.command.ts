import { ICommand } from '@core/mediator/interfaces';

export class DeleteSupplierCommand implements ICommand<void> {
  constructor(public readonly id: string) {}
}
