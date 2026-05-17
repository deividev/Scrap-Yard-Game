import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameStateService],
    });

    service = TestBed.inject(GameStateService);
  });

  it('should start in main menu and navigate between views', () => {
    expect(service.view()).toBe('main-menu');
    expect(service.isInMenu()).toBe(true);
    expect(service.isInGame()).toBe(false);

    service.startGame();
    expect(service.view()).toBe('game');
    expect(service.isInGame()).toBe(true);

    service.openOptions();
    expect(service.view()).toBe('options');

    service.returnToMenu();
    expect(service.view()).toBe('main-menu');
    expect(service.isInMenu()).toBe(true);
  });
});