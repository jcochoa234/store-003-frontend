import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { IRequestHandler } from '../../../../core/mediator/interfaces';
import { Result } from '../../../../core/models/result.model';
import { UpdateProductCommand } from './update-product.command';

/**
 * Handler for UpdateProductCommand.
 * Calls PUT /products/{id} with the full command body (including id).
 *
 * The API controller validates: if (id != command.Id) return BadRequest()
 * so the body MUST include the id field.
 */
@Injectable({ providedIn: 'root' })
export class UpdateProductHandler
  implements IRequestHandler<UpdateProductCommand, void>
{
  private readonly api = inject(ApiService);

  handle(request: UpdateProductCommand): Observable<Result<void>> {
    // Send the full payload including id — API validates route id == body id
    return this.api.put<void>(`/products/${request.payload.id}`, request.payload);
  }
}
