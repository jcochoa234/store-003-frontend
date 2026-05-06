import { Pipe, PipeTransform } from '@angular/core';
import { StatusDataPolicy, StatusDataPolicyLabels } from '../../core/models/status-data-policy.enum';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(status: StatusDataPolicy | string): string {
    return StatusDataPolicyLabels[status as StatusDataPolicy] ?? status;
  }
}

@Pipe({ name: 'statusColor', standalone: true })
export class StatusColorPipe implements PipeTransform {
  transform(status: StatusDataPolicy | string): string {
    switch (status) {
      case StatusDataPolicy.Active:   return 'success';
      case StatusDataPolicy.Inactive: return 'warning';
      case StatusDataPolicy.Deleted:  return 'error';
      default:                        return 'default';
    }
  }
}
