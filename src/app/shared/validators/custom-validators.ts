import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validators mirroring FluentValidation rules from the .NET backend.
 */
export class CustomValidators {
  /** Validates that a price value is >= 0 */
  static positiveOrZero(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') return null;
      return Number(value) >= 0 ? null : { positiveOrZero: { actual: value } };
    };
  }

  /** Validates that a string is not only whitespace */
  static notWhiteSpace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value;
      if (!value) return null;
      return value.trim().length > 0 ? null : { notWhiteSpace: true };
    };
  }

  /** Validates page size is between min and max — mirrors GetProductsQueryValidator */
  static pageSize(min = 1, max = 100): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = Number(control.value);
      if (isNaN(value)) return { pageSize: { min, max } };
      return value >= min && value <= max ? null : { pageSize: { min, max, actual: value } };
    };
  }

  /** GUID/UUID validator */
  static guid(): ValidatorFn {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value;
      if (!value) return null;
      return guidRegex.test(value) ? null : { guid: { actual: value } };
    };
  }
}
