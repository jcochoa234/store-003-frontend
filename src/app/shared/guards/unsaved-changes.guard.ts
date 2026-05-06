import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { defaultIfEmpty, map } from 'rxjs';
import { ConfirmService } from '../services/confirm.service';
import { CanDeactivateComponent } from './can-deactivate.interface';

export const unsavedChangesGuard: CanDeactivateFn<CanDeactivateComponent> = (component) => {
  if (!component.hasUnsavedChanges()) return true;
  // Emits true on confirm, false via defaultIfEmpty when user cancels
  return inject(ConfirmService)
    .discardChanges()
    .pipe(map(() => true), defaultIfEmpty(false as boolean));
};
