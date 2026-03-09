import { Injectable, signal } from '@angular/core';

/**
 * Tipos de vista de la aplicación
 */
export type GameView = 'main-menu' | 'game' | 'options';

/**
 * Servicio para gestionar el estado general del juego
 * (menú principal, juego activo, etc.)
 */
@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  /**
   * Vista actual de la aplicación
   * Comienza en el menú principal
   */
  private currentView = signal<GameView>('main-menu');

  /**
   * Getter reactivo de la vista actual
   */
  view = this.currentView.asReadonly();

  /**
   * Cambia la vista actual
   */
  setView(view: GameView): void {
    this.currentView.set(view);
  }

  /**
   * Navega al juego
   */
  startGame(): void {
    this.setView('game');
  }

  /**
   * Vuelve al menú principal
   */
  returnToMenu(): void {
    this.setView('main-menu');
  }

  /**
   * Abre el menú de opciones
   */
  openOptions(): void {
    this.setView('options');
  }

  /**
   * Verifica si estamos en el menú principal
   */
  isInMenu(): boolean {
    return this.currentView() === 'main-menu';
  }

  /**
   * Verifica si estamos en el juego
   */
  isInGame(): boolean {
    return this.currentView() === 'game';
  }
}
