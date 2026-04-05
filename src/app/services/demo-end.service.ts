import { Injectable, signal } from '@angular/core';

type SaveMarker = { markDirty(): void };

@Injectable({
  providedIn: 'root',
})
export class DemoEndService {
  private _isVisible = signal(false);
  private _seen = signal(false);
  private saveService?: SaveMarker;

  readonly isVisible = this._isVisible.asReadonly();
  readonly seen = this._seen.asReadonly();

  setSaveService(saveService: SaveMarker): void {
    this.saveService = saveService;
  }

  triggerIfNeeded(): void {
    console.log('[DemoEnd] triggerIfNeeded — seen:', this._seen());
    if (this._seen()) return;
    this._isVisible.set(true);
  }

  /** Solo para preview en desarrollo — no usar en producción */
  forceShow(): void {
    this._isVisible.set(true);
  }

  dismiss(): void {
    this._isVisible.set(false);
    this._seen.set(true);
    this.saveService?.markDirty();
  }

  getState(): boolean {
    return this._seen();
  }

  loadState(seen: boolean): void {
    this._seen.set(seen);
  }
}
