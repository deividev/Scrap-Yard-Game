import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-notification-container',
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      @for (notification of notificationService.notifications$(); track notification.id) {
        <div class="notification" [class]="'notification-' + notification.type">
          <span class="notification-icon">
            @if (notification.icon) {
              <span class="notification-machine-badge">
                <img [src]="notification.icon" alt="" class="notification-img-icon" />
              </span>
            } @else if (notification.type === 'unlock') {
              🔓
            } @else if (notification.type === 'success') {
              ✅
            } @else {
              ℹ️
            }
          </span>
          <span class="notification-message">{{ notification.message }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    .notification-container {
      position: fixed;
      top: 80px;
      right: var(--space-6, 24px);
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      pointer-events: none;
      align-items: flex-end;
    }

    .notification {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      background: rgba(18, 20, 24, 0.92);
      backdrop-filter: blur(8px);
      color: var(--color-text-primary);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--border-radius-medium);
      box-shadow:
        0 4px 20px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.06);
      border-left: 5px solid var(--color-accent-main);
      font-size: 14px;
      font-weight: 500;
      min-width: 260px;
      max-width: 360px;
      animation:
        slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1),
        fadeOut 0.3s ease-in 2.2s forwards;
    }

    .notification-icon {
      font-size: 18px;
      flex-shrink: 0;
      line-height: 1;
    }

    .notification-machine-badge {
      width: 56px;
      height: 72px;
      flex-shrink: 0;
      background: linear-gradient(180deg, rgba(220, 174, 92, 0.1) 0%, rgba(20, 20, 20, 0.75) 100%);
      border: 1.5px solid rgba(220, 174, 92, 0.4);
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(220, 174, 92, 0.15);
    }

    .notification-img-icon {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center center;
      display: block;
    }

    .notification-message {
      flex: 1;
      line-height: 1.4;
    }

    .notification-success {
      border-left-color: #22c55e;
      box-shadow:
        0 4px 20px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(34, 197, 94, 0.15);
    }

    .notification-info {
      border-left-color: var(--color-accent-main);
    }

    .notification-unlock {
      border-left-color: #ff9800;
      background: rgba(18, 20, 24, 0.95);
      box-shadow:
        0 4px 24px rgba(255, 152, 0, 0.25),
        0 0 0 1px rgba(255, 152, 0, 0.2);
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(40px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(16px);
      }
    }
  `,
})
export class NotificationContainerComponent {
  notificationService = inject(NotificationService);
}
