export enum ErrorType {
  None = 'None',
  Failure = 'Failure',
  NotFound = 'NotFound',
  Conflict = 'Conflict',
  Validation = 'Validation',
  Unauthorized = 'Unauthorized',
}

export interface AppError {
  code: string;
  message: string;
  type: ErrorType;
}

export interface ValidationError {
  [field: string]: string[];
}

/** RFC 7807 ProblemDetails from the API */
export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  traceId?: string;
  errors?: ValidationError;
}

export const AppErrors = {
  notFound: (entity: string): AppError => ({
    code: `${entity}.NotFound`,
    message: `${entity} not found.`,
    type: ErrorType.NotFound,
  }),
  network: (): AppError => ({
    code: 'Network.Error',
    message: 'Connection error. Check your network.',
    type: ErrorType.Failure,
  }),
  unknown: (): AppError => ({
    code: 'Unknown.Error',
    message: 'An unexpected error has occurred.',
    type: ErrorType.Failure,
  }),
};
