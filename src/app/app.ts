import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { ResourcesHeaderComponent } from './components/resources-header/resources-header.component';
import { MachineListComponent } from './components/machine-list/machine-list.component';
import { UpgradesPanelComponent } from './components/upgrades-panel/upgrades-panel.component';
import { NotificationContainerComponent } from './components/ui/notification-container/notification-container.component';
import { MainMenuComponent } from './components/main-menu/main-menu.component';
import { CommonModule } from '@angular/common';
import { SaveService } from './services/save.service';
import { ResourcesService } from './services/resources.service';
import { MachinesService } from './services/machines.service';
import { UpgradesService } from './services/upgrades.service';
import { ScrapGenerationService } from './services/scrap-generation.service';
import { GameStateService } from './services/game-state.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    ResourcesHeaderComponent,
    MachineListComponent,
    UpgradesPanelComponent,
    NotificationContainerComponent,
    MainMenuComponent,
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
  gameStateService = inject(GameStateService);

  private beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    this.saveService.save();
  };

  ngOnInit(): void {
    this.resourcesService.setSaveService(this.saveService);
    this.machinesService.setSaveService(this.saveService);
    this.upgradesService.setSaveService(this.saveService);
    this.scrapGenerationService.setSaveService(this.saveService);

    // Cargar el juego en segundo plano
    // Si no hay save, se usarán los valores por defecto
    this.saveService.load();

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  ngOnDestroy(): void {
    this.saveService.save();
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  }

  onPanelMinimizedChange(isMinimized: boolean): void {
    this.isPanelMinimized = isMinimized;
  }
}
