import { TestBed, inject } from '@angular/core/testing';

import { Error.InterceptorService } from './error.interceptor.service';

describe('Error.InterceptorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Error.InterceptorService]
    });
  });

  it('should be created', inject([Error.InterceptorService], (service: Error.InterceptorService) => {
    expect(service).toBeTruthy();
  }));
});
