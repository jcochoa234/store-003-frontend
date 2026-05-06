export enum StatusDataPolicy {
  Active = 'Active',
  Inactive = 'Inactive',
  Deleted = 'Deleted',
}

export const StatusDataPolicyLabels: Record<StatusDataPolicy, string> = {
  [StatusDataPolicy.Active]:   'Active',
  [StatusDataPolicy.Inactive]: 'Inactive',
  [StatusDataPolicy.Deleted]:  'Deleted',
};

/** Shared select options for status fields in form components. */
export const STATUS_OPTIONS = [
  { label: 'Active',   value: StatusDataPolicy.Active },
  { label: 'Inactive', value: StatusDataPolicy.Inactive },
  { label: 'Deleted',  value: StatusDataPolicy.Deleted },
] as const;
