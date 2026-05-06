import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/http/api.service';
import { Result } from '@core/models/result.model';
import { AppErrors } from '@core/models/error.model';
import { StatusDataPolicy } from '@core/models/status-data-policy.enum';
import { CreateSupplierCommand } from './create-supplier.command';
import { CreateSupplierHandler } from './create-supplier.handler';

describe('CreateSupplierHandler', () => {
  let handler: CreateSupplierHandler;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        CreateSupplierHandler,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    handler = TestBed.inject(CreateSupplierHandler);
  });

  it('calls POST /suppliers with the command payload', () => {
    const newId = 'new-guid';
    apiSpy.post.and.returnValue(of(Result.success(newId)));

    const command = new CreateSupplierCommand({
      name: 'ACME Corp', contactEmail: 'acme@example.com', phone: '555-0001', status: StatusDataPolicy.Active,
    });

    handler.handle(command).subscribe(result => {
      expect(result.isSuccess).toBeTrue();
      expect(result.value).toBe(newId);
    });

    expect(apiSpy.post).toHaveBeenCalledOnceWith('/suppliers', command.payload);
  });

  it('propagates a failure result to the caller', () => {
    apiSpy.post.and.returnValue(of(Result.failure(AppErrors.unknown())));

    handler.handle(new CreateSupplierCommand({
      name: 'X', contactEmail: 'x@x.com', phone: '0', status: StatusDataPolicy.Active,
    })).subscribe(result => {
      expect(result.isFailure).toBeTrue();
    });
  });
});
