import { Component } from '@angular/core';

@Component({
  selector: 'app-panel-frame-h',
  standalone: true,
  styleUrls: ['./panel-frame-h.component.css'],
  template: `
    <ng-content />
    <div class="pfh" aria-hidden="true">
      <!-- Edges first — corners render on top of them -->
      <div class="e-h e-top"></div>
      <div class="e-h e-bot"></div>
      <div class="e-v e-left"></div>
      <div class="e-v e-right"></div>
      <div class="c c-tl"></div>
      <div class="c c-tr"></div>
      <div class="c c-bl"></div>
      <div class="c c-br"></div>
    </div>
  `,
})
export class PanelFrameHComponent {}
