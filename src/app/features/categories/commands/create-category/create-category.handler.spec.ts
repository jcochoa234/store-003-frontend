import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { HttpCacheService } from '../../../../core/http/http-cache.service';
import { Result } from '../../../../core/models/result.model';
import { AppErrors } from '../../../../core/models/error.model';
import { StatusDataPolicy } from '../../../../core/models/status-data-policy.enum';
import { CreateCategoryCommand } from './create-category.command';
import { CreateCategoryHandler } from './create-category.handler';

describe('CreateCategoryHandler', () => {
  let handler: CreateCategoryHandler;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let cacheSpy: jasmine.SpyObj<HttpCacheService>;

  beforeEach(() => {
    apiSpy   = jasmine.createSpyObj('ApiService', ['post']);
    cacheSpy = jasmine.createSpyObj('HttpCacheService', ['invalidate']);

    TestBed.configureTestingModule({
      providers: [
        CreateCategoryHandler,
        { provide: ApiService,       useValue: apiSpy   },
        { provide: HttpCacheService, useValue: cacheSpy },
      ],
    });

    handler = TestBed.inject(CreateCategoryHandler);
  });

  it('calls POST /categories with the command payload', () => {
    const newId = 'abc-123';
    apiSpy.post.and.returnValue(of(Result.success(newId)));

    const command = new CreateCategoryCommand({
      name: 'Widgets', description: '', status: StatusDataPolicy.Active,
    });

    handler.handle(command).subscribe(result => {
      expect(result.isSuccess).toBeTrue();
      expect(result.value).toBe(newId);
    });

    expect(apiSpy.post).toHaveBeenCalledOnceWith('/categories', command.payload);
  });

  it('invalidates the category cache on success', () => {
    apiSpy.post.and.returnValue(of(Result.success('new-id')));

    handler.handle(new CreateCategoryCommand({
      name: 'Test', description: '', status: StatusDataPolicy.Active,
    })).subscribe();

    expect(cacheSpy.invalidate).toHaveBeenCalledOnceWith('categories:');
  });

  it('does NOT invalidate cache on failure', () => {
    apiSpy.post.and.returnValue(of(Result.failure(AppErrors.unknown())));

    handler.handle(new CreateCategoryCommand({
      name: 'Test', description: '', status: StatusDataPolicy.Active,
    })).subscribe();

    expect(cacheSpy.invalidate).not.toHaveBeenCalled();
  });

  it('propagates a failure result to the caller', () => {
    const error = AppErrors.unknown();
    apiSpy.post.and.returnValue(of(Result.failure(error)));

    handler.handle(new CreateCategoryCommand({
      name: 'Test', description: '', status: StatusDataPolicy.Active,
    })).subscribe(result => {
      expect(result.isFailure).toBeTrue();
      expect(result.error).toEqual(error);
    });
  });
});
