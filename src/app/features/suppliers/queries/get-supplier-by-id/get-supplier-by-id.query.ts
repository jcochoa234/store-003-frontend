import { IQuery } from '@core/mediator/interfaces';
import { SupplierDto } from '../../models/supplier.model';

export class GetSupplierByIdQuery implements IQuery<SupplierDto> {
  constructor(public readonly id: string) {}
}
