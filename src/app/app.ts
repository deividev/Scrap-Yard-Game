import { Component } from '@angular/core';
import { ResourcesPanelComponent } from './components/resources-panel/resources-panel.component';

@Component({
  selector: 'app-root',
  imports: [ResourcesPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
