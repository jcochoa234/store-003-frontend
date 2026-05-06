import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { StatusLabelPipe, StatusColorPipe } from '../../pipes/status.pipe';
import { StatusDataPolicy } from '../../../core/models/status-data-policy.enum';

/**
 * Renders a colored NzTag for a StatusDataPolicy value,
 * or an em-dash placeholder when the status is null/undefined.
 *
 * Usage:
 *   <app-status-tag [status]="entity.status"></app-status-tag>
 */
@Component({
  selector: 'app-status-tag',
  standalone: true,
  imports: [NzTagModule, StatusLabelPipe, StatusColorPipe],
  template: `
    @if (status) {
      <nz-tag [nzColor]="status | statusColor">{{ status | statusLabel }}</nz-tag>
    } @else {
      <span class="text-muted">—</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusTagComponent {
  @Input() status: StatusDataPolicy | null | undefined;
}
