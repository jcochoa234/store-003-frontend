import { StatusDataPolicy } from '../../core/models/status-data-policy.enum';
import { StatusColorPipe, StatusLabelPipe } from './status.pipe';

describe('StatusLabelPipe', () => {
  let pipe: StatusLabelPipe;

  beforeEach(() => { pipe = new StatusLabelPipe(); });

  it('returns "Active" for Active status',   () => expect(pipe.transform(StatusDataPolicy.Active)).toBe('Active'));
  it('returns "Inactive" for Inactive status', () => expect(pipe.transform(StatusDataPolicy.Inactive)).toBe('Inactive'));
  it('returns "Deleted" for Deleted status',  () => expect(pipe.transform(StatusDataPolicy.Deleted)).toBe('Deleted'));
  it('returns the raw value for unknown status', () => expect(pipe.transform('unknown' as StatusDataPolicy)).toBe('unknown'));
});

describe('StatusColorPipe', () => {
  let pipe: StatusColorPipe;

  beforeEach(() => { pipe = new StatusColorPipe(); });

  it('returns "success" for Active',   () => expect(pipe.transform(StatusDataPolicy.Active)).toBe('success'));
  it('returns "warning" for Inactive', () => expect(pipe.transform(StatusDataPolicy.Inactive)).toBe('warning'));
  it('returns "error" for Deleted',    () => expect(pipe.transform(StatusDataPolicy.Deleted)).toBe('error'));
  it('returns "default" for unknown',  () => expect(pipe.transform('unknown' as StatusDataPolicy)).toBe('default'));
});
