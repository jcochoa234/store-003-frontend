import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpinModule } from 'ng-zorro-antd/spin';

/**
 * Handles the skeleton-on-first-load / spinner-on-reload pattern used by list pages.
 *
 * - When both initialLoad and loading are true  → shows a skeleton placeholder.
 * - Otherwise                                   → shows nz-spin wrapping projected content.
 *
 * Usage:
 *   <app-loading-container [initialLoad]="initialLoad()" [loading]="loading()">
 *     <nz-table ...>...</nz-table>
 *   </app-loading-container>
 */
@Component({
  selector: 'app-loading-container',
  standalone: true,
  imports: [NzSkeletonModule, NzSpinModule],
  template: `
    @if (initialLoad && loading) {
      <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: skeletonRows }"></nz-skeleton>
    } @else {
      <nz-spin [nzSpinning]="loading">
        <ng-content></ng-content>
      </nz-spin>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingContainerComponent {
  @Input() initialLoad  = false;
  @Input() loading      = false;
  @Input() skeletonRows = 5;
}
