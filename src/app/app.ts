import { Component, signal, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { ResourcesHeaderComponent } from './components/resources-header/resources-header.component';
import { MachineListComponent } from './components/machine-list/machine-list.component';
import { UpgradesPanelComponent } from './components/upgrades-panel/upgrades-panel.component';
import { NotificationContainerComponent } from './components/ui/notification-container/notification-container.component';
import { MainMenuComponent } from './components/main-menu/main-menu.component';
import { OptionsMenuComponent } from './components/options-menu/options-menu.component';
import { StatisticsPanelComponent } from './components/statistics-panel/statistics-panel.component';
import { CommonModule } from '@angular/common';
import { BackgroundGridComponent } from './components/ui/background-grid/background-grid.component';
import { FirstRunTutorialOverlayComponent } from './components/first-run-tutorial-overlay/first-run-tutorial-overlay.component';
import { SaveService } from './services/save.service';
import { ResourcesService } from './services/resources.service';
import { MachinesService } from './services/machines.service';
import { UpgradesService } from './services/upgrades.service';
import { ScrapGenerationService } from './services/scrap-generation.service';
import { GameStateService } from './services/game-state.service';
import { AudioService } from './services/audio.service';
import { GameLoopService } from './services/game-loop.service';
import { FirstRunTutorialService } from './services/first-run-tutorial.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    ResourcesHeaderComponent,
    MachineListComponent,
    UpgradesPanelComponent,
    NotificationContainerComponent,
    MainMenuComponent,
    OptionsMenuComponent,
    StatisticsPanelComponent,
    BackgroundGridComponent,
    FirstRunTutorialOverlayComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  isPanelMinimized = false;

  private saveService = inject(SaveService);
  private resourcesService = inject(ResourcesService);
  private machinesService = inject(MachinesService);
  private upgradesService = inject(UpgradesService);
  private scrapGenerationService = inject(ScrapGenerationService);
  private audioService = inject(AudioService);
  private gameLoopService = inject(GameLoopService);
  private firstRunTutorialService = inject(FirstRunTutorialService);
  gameStateService = inject(GameStateService);

  private autoSaveInterval?: number;

  // Effect automatically cleaned up by Angular's injection context (component lifetime)
  private viewAudioEffect = effect(() => {
    const currentView = this.gameStateService.view();
    if (currentView === 'game') {
      this.firstRunTutorialService.startIfNeeded();
      this.audioService.playGameMusicLoop();
      this.gameLoopService.start();
      return;
    }

    this.audioService.stopGameMusicLoop();
    this.gameLoopService.stop();
  });

  private beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    this.saveService.save().catch((err) => console.error('[App] beforeUnload save failed:', err));
  };

  ngOnInit(): void {
    this.resourcesService.setSaveService(this.saveService);
    this.machinesService.setSaveService(this.saveService);
    this.upgradesService.setSaveService(this.saveService);
    this.scrapGenerationService.setSaveService(this.saveService);
    this.firstRunTutorialService.setSaveService(this.saveService);

    // Cargar el juego en segundo plano
    // Si no hay save, se usarán los valores por defecto
    this.saveService.load();

    // Inicializar sistema de audio (música + SFX)
    this.audioService.init();

    // Auto-save cada 10 segundos si hay cambios pendientes
    this.autoSaveInterval = window.setInterval(() => {
      if (this.saveService.isDirtyState()) {
        this.saveService.save().catch((error) => {
          console.error('[App] Auto-save failed:', error);
        });
      }
    }, 10000);

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  ngOnDestroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.saveService.save().catch((err) => console.error('[App] ngOnDestroy save failed:', err));
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  }

  onPanelMinimizedChange(isMinimized: boolean): void {
    this.isPanelMinimized = isMinimized;
  }
}
