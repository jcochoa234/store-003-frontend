import { Injectable, inject } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AppError } from '../../core/models/error.model';

/**
 * Centralized notification service — thin wrapper over NzMessageService.
 *
 * Eliminates hard-coded success/error strings scattered across components
 * and ensures a consistent message format throughout the app.
 *
 * Usage:
 *   this.notify.created('Category');  → "Category created successfully."
 *   this.notify.updated('Product');   → "Product updated successfully."
 *   this.notify.deleted('Category');  → "Category deleted successfully."
 *   this.notify.error(err);           → err.message (from AppError or plain string)
 */
@Injectable({ providedIn: 'root' })
export class NotifyService {
  private readonly msg = inject(NzMessageService);

  success(text: string): void {
    this.msg.success(text);
  }

  error(error: AppError | string): void {
    const text = typeof error === 'string' ? error : error.message;
    this.msg.error(text);
  }

  created(entity: string): void {
    this.msg.success(`${entity} created successfully.`);
  }

  updated(entity: string): void {
    this.msg.success(`${entity} updated successfully.`);
  }

  deleted(entity: string): void {
    this.msg.success(`${entity} deleted successfully.`);
  }
}
