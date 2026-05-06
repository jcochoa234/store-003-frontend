import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { Result } from '@core/models/result.model';
import { AppErrors } from '@core/models/error.model';
import { DeleteSupplierCommand } from './delete-supplier.command';
import { DeleteSupplierHandler } from './delete-supplier.handler';

describe('DeleteSupplierHandler', () => {
  let handler: DeleteSupplierHandler;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['delete']);

    TestBed.configureTestingModule({
      providers: [
        DeleteSupplierHandler,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    handler = TestBed.inject(DeleteSupplierHandler);
  });

  it('calls DELETE /suppliers/:id', () => {
    apiSpy.delete.and.returnValue(of(Result.success(undefined)));

    handler.handle(new DeleteSupplierCommand('abc')).subscribe(result => {
      expect(result.isSuccess).toBeTrue();
    });

    expect(apiSpy.delete).toHaveBeenCalledOnceWith('/suppliers/abc');
  });

  it('propagates a failure result', () => {
    apiSpy.delete.and.returnValue(of(Result.failure(AppErrors.unknown())));

    handler.handle(new DeleteSupplierCommand('bad')).subscribe(result => {
      expect(result.isFailure).toBeTrue();
    });
  });
});
