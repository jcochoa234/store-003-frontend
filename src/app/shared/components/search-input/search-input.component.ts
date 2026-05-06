import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';

/**
 * Reusable search input with a prefix search icon and a clear (×) suffix button.
 *
 * Supports two-way binding via [(value)]. The parent is responsible for
 * debouncing — listen to (valueChange) and feed it to a Subject with debounceTime.
 *
 * Usage:
 *   <app-search-input
 *     placeholder="Search categories..."
 *     [(value)]="searchValue"
 *     (valueChange)="onSearch($event)"
 *     (cleared)="clearSearch()">
 *   </app-search-input>
 */
@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [FormsModule, NzInputModule, NzIconModule],
  template: `
    <nz-input-group class="search-input-group" [nzPrefix]="prefixTpl" [nzSuffix]="suffixTpl">
      <input
        nz-input
        [ngModel]="value"
        (ngModelChange)="onInputChange($event)"
        [placeholder]="placeholder"
        [attr.aria-label]="placeholder" />
    </nz-input-group>

    <ng-template #prefixTpl>
      <span nz-icon nzType="search" style="color: rgba(0,0,0,.45)"></span>
    </ng-template>

    <ng-template #suffixTpl>
      @if (value) {
        <span
          nz-icon nzType="close-circle"
          style="color: rgba(0,0,0,.45); cursor: pointer;"
          (click)="onClear()"
          aria-label="Clear search">
        </span>
      }
    </ng-template>
  `,
  styles: [`
    :host { display: block; }
    .search-input-group { width: 260px; max-width: 100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  @Input() value = '';
  @Input() placeholder = 'Search...';

  @Output() valueChange = new EventEmitter<string>();
  @Output() cleared     = new EventEmitter<void>();

  onInputChange(val: string): void {
    this.value = val;
    this.valueChange.emit(val);
  }

  onClear(): void {
    this.value = '';
    this.valueChange.emit('');
    this.cleared.emit();
  }
}
