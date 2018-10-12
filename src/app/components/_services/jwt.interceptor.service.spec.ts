import { TestBed, inject } from '@angular/core/testing';

import { Jwt.InterceptorService } from './jwt.interceptor.service';

describe('Jwt.InterceptorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Jwt.InterceptorService]
    });
  });

  it('should be created', inject([Jwt.InterceptorService], (service: Jwt.InterceptorService) => {
    expect(service).toBeTruthy();
  }));
});
