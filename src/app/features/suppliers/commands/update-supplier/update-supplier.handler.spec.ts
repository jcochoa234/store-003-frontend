import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { Result } from '@core/models/result.model';
import { AppErrors } from '@core/models/error.model';
import { StatusDataPolicy } from '@core/models/status-data-policy.enum';
import { UpdateSupplierCommand } from './update-supplier.command';
import { UpdateSupplierHandler } from './update-supplier.handler';

describe('UpdateSupplierHandler', () => {
  let handler: UpdateSupplierHandler;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['put']);

    TestBed.configureTestingModule({
      providers: [
        UpdateSupplierHandler,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    handler = TestBed.inject(UpdateSupplierHandler);
  });

  it('calls PUT /suppliers/:id with the command payload', () => {
    apiSpy.put.and.returnValue(of(Result.success(undefined)));

    const payload = { id: 'abc', name: 'ACME Updated', contactEmail: 'new@example.com', phone: '555-0002', status: StatusDataPolicy.Active };
    const command = new UpdateSupplierCommand(payload);

    handler.handle(command).subscribe(result => {
      expect(result.isSuccess).toBeTrue();
    });

    expect(apiSpy.put).toHaveBeenCalledOnceWith('/suppliers/abc', command.payload);
  });

  it('propagates a failure result', () => {
    apiSpy.put.and.returnValue(of(Result.failure(AppErrors.unknown())));

    handler.handle(new UpdateSupplierCommand({ id: 'x', name: 'X', contactEmail: 'x@x.com', phone: '0', status: StatusDataPolicy.Active }))
      .subscribe(result => {
        expect(result.isFailure).toBeTrue();
      });
  });
});
