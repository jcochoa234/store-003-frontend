import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { Result } from '@core/models/result.model';
import { AppErrors } from '@core/models/error.model';
import { StatusDataPolicy } from '@core/models/status-data-policy.enum';
import { GetSupplierByIdQuery } from './get-supplier-by-id.query';
import { GetSupplierByIdHandler } from './get-supplier-by-id.handler';
import { SupplierDto } from '../../models/supplier.model';

describe('GetSupplierByIdHandler', () => {
  let handler: GetSupplierByIdHandler;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        GetSupplierByIdHandler,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    handler = TestBed.inject(GetSupplierByIdHandler);
  });

  it('calls GET /suppliers/:id', () => {
    const supplier: SupplierDto = { id: 'abc', name: 'ACME', contactEmail: 'a@b.com', phone: '555', status: StatusDataPolicy.Active };
    apiSpy.get.and.returnValue(of(Result.success(supplier)));

    handler.handle(new GetSupplierByIdQuery('abc')).subscribe(result => {
      expect(result.isSuccess).toBeTrue();
      expect(result.value?.id).toBe('abc');
    });

    expect(apiSpy.get).toHaveBeenCalledOnceWith('/suppliers/abc');
  });

  it('propagates a failure result', () => {
    apiSpy.get.and.returnValue(of(Result.failure(AppErrors.unknown())));

    handler.handle(new GetSupplierByIdQuery('bad-id')).subscribe(result => {
      expect(result.isFailure).toBeTrue();
    });
  });
});
