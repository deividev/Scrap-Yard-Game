import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'unlock' | 'warning';
  timestamp: number;
  icon?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);
  private nextId = 1;
  private readonly MAX_VISIBLE = 3;
  private readonly DURATIONS = {
    success: 3000, // Upgrades: 3 segundos
    info: 3500, // Info: 3.5 segundos
    unlock: 5000, // Desbloqueos: 5 segundos
    warning: 4500, // Warnings: 4.5 segundos
  };

  notifications$ = this.notifications.asReadonly();

  show(message: string, type: 'success' | 'info' | 'unlock' | 'warning' = 'info', icon?: string): void {
    const notification: Notification = {
      id: this.nextId++,
      message,
      type,
      timestamp: Date.now(),
      icon,
    };

    this.notifications.update((current) => {
      const updated = [...current, notification];
      return updated.slice(-this.MAX_VISIBLE);
    });

    const duration = this.DURATIONS[type];
    setTimeout(() => {
      this.remove(notification.id);
    }, duration);
  }

  private remove(id: number): void {
    this.notifications.update((current) => current.filter((n) => n.id !== id));
  }
}
