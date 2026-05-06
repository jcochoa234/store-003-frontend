import { ICommand } from '@core/mediator/interfaces';
import { UpdateSupplierRequest } from '../../models/supplier.model';

export class UpdateSupplierCommand implements ICommand<void> {
  constructor(public readonly payload: UpdateSupplierRequest) {}
}
