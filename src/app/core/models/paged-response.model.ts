/** Mirrors PagedResponse<T> from the .NET backend */
export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PagedQuery {
  page: number;
  pageSize: number;
}

export const DEFAULT_PAGE_SIZE = 10;

export function defaultPagedResponse<T>(): PagedResponse<T> {
  return {
    items: [],
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}
