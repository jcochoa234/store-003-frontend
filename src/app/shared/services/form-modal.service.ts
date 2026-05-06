import { Injectable, Type, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';

/** Any form component opened as a modal must implement this. */
export interface ModalForm {
  cancel(): void;
}

export interface FormModalOptions {
  title:  string;
  data?:  unknown;
  width?: number;
}

/**
 * Encapsulates the repeated modal.create() + lazy-import + afterClose pattern
 * used by every entity list and detail component.
 *
 * Usage:
 *   this.formModal.open(
 *     () => import('../category-form/category-form.component').then(m => m.CategoryFormComponent),
 *     { title: id ? 'Edit Category' : 'New Category', data: { id } }
 *   ).subscribe(saved => { if (saved) this.loadCategories(); });
 */
@Injectable({ providedIn: 'root' })
export class FormModalService {
  private readonly modal = inject(NzModalService);

  /**
   * Lazy-loads the component, opens it as a modal, and returns an Observable<boolean>
   * that emits `true` when the form was saved, or `false` when cancelled/closed.
   */
  open<T extends ModalForm>(
    loader:  () => Promise<Type<T>>,
    options: FormModalOptions,
  ): Observable<boolean> {
    return new Observable<boolean>(observer => {
      loader().then(ComponentClass => {
        const ref = this.modal.create<T>({
          nzTitle:        options.title,
          nzContent:      ComponentClass,
          nzData:         options.data ?? {},
          nzFooter:       null,
          nzWidth:        options.width ?? 560,
          nzMaskClosable: false,
          nzOnCancel:     () => { ref.getContentComponent()?.cancel(); return false; },
        });
        ref.afterClose.subscribe((result: unknown) => {
          observer.next(result === true);
          observer.complete();
        });
      });
    });
  }
}
