import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';

export interface ConfirmOptions {
  title: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  okDanger?: boolean;
}

/**
 * Centralized confirmation dialog service.
 * All methods return an Observable<void> that emits once when the user confirms
 * and completes without emitting when the user cancels.
 *
 * Usage:
 *   this.confirm.delete(item.name).subscribe(() => this.doDelete());
 *   this.confirm.discardChanges().subscribe(() => this.modalRef.close(false));
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly modal = inject(NzModalService);

  /** Standard delete confirmation with the item name in the title. */
  delete(itemName: string): Observable<void> {
    return this._open({
      title: `Delete "${itemName}"?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okDanger: true,
      cancelText: 'Cancel',
    });
  }

  /** "Unsaved changes" confirmation for dirty-form navigation. */
  discardChanges(): Observable<void> {
    return this._open({
      title: 'Unsaved Changes',
      content: 'You have unsaved changes that will be lost. Are you sure?',
      okText: 'Discard',
      okDanger: true,
      cancelText: 'Keep editing',
    });
  }

  /** Generic confirmation — use when neither delete nor discardChanges fits. */
  confirm(options: ConfirmOptions): Observable<void> {
    return this._open(options);
  }

  private _open(options: ConfirmOptions): Observable<void> {
    return new Observable<void>(observer => {
      this.modal.confirm({
        nzTitle:      options.title,
        nzContent:    options.content,
        nzOkText:     options.okText     ?? 'OK',
        nzOkDanger:   options.okDanger   ?? false,
        nzCancelText: options.cancelText ?? 'Cancel',
        nzOnOk:     () => { observer.next(); observer.complete(); },
        nzOnCancel: () => { observer.complete(); },
      });
    });
  }
}
