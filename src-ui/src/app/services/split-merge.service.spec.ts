import { TestBed } from '@angular/core/testing';

import { SplitMergeService } from './split-merge.service';

describe('SplitMergeService', () => {
  let service: SplitMergeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SplitMergeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
