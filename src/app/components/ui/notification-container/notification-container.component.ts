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
          {{ notification.message }}
        </div>
      }
    </div>
  `,
  styles: `
    .notification-container {
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      pointer-events: none;
    }

    .notification {
      background: var(--color-bg-panel);
      color: var(--color-text-primary);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--border-radius-medium);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border-left: 3px solid var(--color-accent-main);
      font-size: 14px;
      font-weight: 500;
      min-width: 280px;
      max-width: 400px;
      text-align: center;
      animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-in 2.2s forwards;
    }

    .notification-success {
      border-left-color: var(--color-accent-positive);
    }

    .notification-info {
      border-left-color: var(--color-accent-main);
    }

    .notification-unlock {
      border-left-color: #ff9800;
      background: linear-gradient(135deg, var(--color-bg-panel) 0%, rgba(255, 152, 0, 0.1) 100%);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `,
})
export class NotificationContainerComponent {
  notificationService = inject(NotificationService);
}
