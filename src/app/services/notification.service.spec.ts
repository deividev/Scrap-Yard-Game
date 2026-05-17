import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-16T16:00:00.000Z'));

    TestBed.configureTestingModule({
      providers: [NotificationService],
    });

    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should keep only the latest three notifications and auto-remove by type duration', () => {
    service.show('one', 'info');
    service.show('two', 'success');
    service.show('three', 'unlock');
    service.show('four', 'warning');

    expect(service.notifications$().map((notification) => notification.message)).toEqual([
      'two',
      'three',
      'four',
    ]);

    vi.advanceTimersByTime(3000);
    expect(service.notifications$().map((notification) => notification.message)).toEqual([
      'three',
      'four',
    ]);

    vi.advanceTimersByTime(2000);
    expect(service.notifications$()).toEqual([]);
  });
});