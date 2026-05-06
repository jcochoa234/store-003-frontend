import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { Result } from '@core/models/result.model';
import { AppErrors } from '@core/models/error.model';
import { StatusDataPolicy } from '@core/models/status-data-policy.enum';
import { PagedResponse } from '@core/models/paged-response.model';
import { GetSuppliersQuery } from './get-suppliers.query';
import { GetSuppliersHandler } from './get-suppliers.handler';
import { SupplierDto } from '../../models/supplier.model';

describe('GetSuppliersHandler', () => {
  let handler: GetSuppliersHandler;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        GetSuppliersHandler,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    handler = TestBed.inject(GetSuppliersHandler);
  });

  it('calls GET /suppliers with the query params', () => {
    const fakeResponse: PagedResponse<SupplierDto> = {
      items: [{ id: '1', name: 'ACME', contactEmail: 'a@b.com', phone: '555-0000', status: StatusDataPolicy.Active }],
      page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false,
    };
    apiSpy.get.and.returnValue(of(Result.success(fakeResponse)));

    const query = new GetSuppliersQuery({ page: 1, pageSize: 10 });

    handler.handle(query).subscribe(result => {
      expect(result.isSuccess).toBeTrue();
      expect(result.value?.items.length).toBe(1);
    });

    expect(apiSpy.get).toHaveBeenCalledOnceWith('/suppliers', { page: 1, pageSize: 10 });
  });

  it('propagates a failure result to the caller', () => {
    const error = AppErrors.unknown();
    apiSpy.get.and.returnValue(of(Result.failure(error)));

    handler.handle(new GetSuppliersQuery({ page: 1, pageSize: 10 })).subscribe(result => {
      expect(result.isFailure).toBeTrue();
      expect(result.error).toEqual(error);
    });
  });
});
