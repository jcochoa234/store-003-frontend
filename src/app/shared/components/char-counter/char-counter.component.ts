import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Displays a character count indicator for text inputs.
 * Applies a warning style when current count reaches 90% of max.
 *
 * Usage (inside nz-form-control [nzExtra]):
 *   <ng-template #nameExtra>
 *     <app-char-counter [current]="nameLength()" [max]="NAME_MAX"></app-char-counter>
 *   </ng-template>
 */
@Component({
  selector: 'app-char-counter',
  standalone: true,
  template: `<span [class.char-count-warn]="current >= max * 0.9" class="char-count">{{ current }} / {{ max }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharCounterComponent {
  @Input() current = 0;
  @Input() max = 0;
}
