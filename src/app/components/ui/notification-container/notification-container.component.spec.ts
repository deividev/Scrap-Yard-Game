import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NotificationContainerComponent } from './notification-container.component';
import { NotificationService } from '../../../services/notification.service';

describe('NotificationContainerComponent', () => {
  it('should render notification messages and choose icon branches by type', () => {
    const notifications = signal([
      { id: 1, message: 'Machine unlocked', type: 'unlock' as const, timestamp: 1 },
      { id: 2, message: 'Upgrade complete', type: 'success' as const, timestamp: 2 },
      { id: 3, message: 'Watch deadline', type: 'warning' as const, timestamp: 3 },
      { id: 4, message: 'FYI', type: 'info' as const, timestamp: 4 },
      { id: 5, message: 'Card art', type: 'unlock' as const, timestamp: 5, icon: 'assets/card.png' },
    ]);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: NotificationService,
          useValue: {
            notifications$: notifications.asReadonly(),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(NotificationContainerComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Machine unlocked');
    expect(text).toContain('Upgrade complete');
    expect(text).toContain('Watch deadline');
    expect(text).toContain('FYI');
    expect(text).toContain('🔓');
    expect(text).toContain('✅');
    expect(text).toContain('⚠️');
    expect(text).toContain('ℹ️');
    expect((fixture.nativeElement.querySelector('.notification-img-icon') as HTMLImageElement).getAttribute('src')).toContain('assets/card.png');
  });
});