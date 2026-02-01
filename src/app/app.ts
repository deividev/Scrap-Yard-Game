import { Component } from '@angular/core';
import { ResourcesPanelComponent } from './components/resources-panel/resources-panel.component';
import { DebugMachinesPanelComponent } from './components/debug-machines-panel/debug-machines-panel';
import { ScrapButtonComponent } from './components/scrap-button/scrap-button.component';

@Component({
  selector: 'app-root',
  imports: [ResourcesPanelComponent, DebugMachinesPanelComponent, ScrapButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
