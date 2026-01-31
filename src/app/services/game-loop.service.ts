import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameLoopService {
  private intervalId: any = null;
  private tickCount = 0;

  start(): void {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    this.tickCount++;
  }

  getTickCount(): number {
    return this.tickCount;
  }
}
