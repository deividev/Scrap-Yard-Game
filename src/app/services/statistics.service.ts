import { Injectable, signal, computed, inject } from '@angular/core';
import { MachinesService } from './machines.service';

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private machinesService = inject(MachinesService);

  private _totalScrapGenerated = signal(0);
  private _playTimeSeconds = signal(0);
  private _totalMoneyEarned = signal(0);

  readonly totalScrapGenerated = this._totalScrapGenerated.asReadonly();
  readonly playTimeSeconds = this._playTimeSeconds.asReadonly();
  readonly totalMoneyEarned = this._totalMoneyEarned.asReadonly();

  readonly activeMachinesCount = computed(
    () => this.machinesService.getAll().filter((m) => m.isActive && m.level > 0).length,
  );

  readonly playTimeFormatted = computed(() => {
    const total = this._playTimeSeconds();
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  });

  tick(scrapGeneratedThisTick: number): void {
    this._playTimeSeconds.update((t) => t + 1);
    if (scrapGeneratedThisTick > 0) {
      this._totalScrapGenerated.update((total) => total + scrapGeneratedThisTick);
    }
  }

  recordScrapGenerated(amount: number): void {
    if (amount > 0) {
      this._totalScrapGenerated.update((total) => total + amount);
    }
  }

  recordMoneyEarned(amount: number): void {
    if (amount > 0) {
      this._totalMoneyEarned.update((total) => total + amount);
    }
  }

  reset(): void {
    this._totalScrapGenerated.set(0);
    this._playTimeSeconds.set(0);
    this._totalMoneyEarned.set(0);
  }

  getState(): { totalScrapGenerated: number; playTimeSeconds: number; totalMoneyEarned: number } {
    return {
      totalScrapGenerated: this._totalScrapGenerated(),
      playTimeSeconds: this._playTimeSeconds(),
      totalMoneyEarned: this._totalMoneyEarned(),
    };
  }

  loadState(state: {
    totalScrapGenerated: number;
    playTimeSeconds: number;
    totalMoneyEarned?: number;
  }): void {
    this._totalScrapGenerated.set(state.totalScrapGenerated ?? 0);
    this._playTimeSeconds.set(state.playTimeSeconds ?? 0);
    this._totalMoneyEarned.set(state.totalMoneyEarned ?? 0);
  }
}
