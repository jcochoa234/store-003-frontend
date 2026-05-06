import { ICommand } from '@core/mediator/interfaces';
import { CreateSupplierRequest } from '../../models/supplier.model';

export class CreateSupplierCommand implements ICommand<string> {
  constructor(public readonly payload: CreateSupplierRequest) {}
}
