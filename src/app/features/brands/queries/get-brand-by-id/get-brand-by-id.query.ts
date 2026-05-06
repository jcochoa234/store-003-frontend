import { IQuery } from '../../../../core/mediator/interfaces';
import { BrandDto } from '../../models/brand.model';

/** Mirrors GetBrandByIdQuery from the .NET Application layer */
export class GetBrandByIdQuery implements IQuery<BrandDto> {
  constructor(public readonly id: string) {}
}
