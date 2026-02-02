import { Component, signal } from '@angular/core';
import { ResourcesHeaderComponent } from './components/resources-header/resources-header.component';
import { MachineListComponent } from './components/machine-list/machine-list.component';
import { UpgradesPanelComponent } from './components/upgrades-panel/upgrades-panel.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule, ResourcesHeaderComponent, MachineListComponent, UpgradesPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  isPanelMinimized = false;

  onPanelMinimizedChange(isMinimized: boolean): void {
    this.isPanelMinimized = isMinimized;
  }
}
