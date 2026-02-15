import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-background-grid',
  standalone: true,
  template: `<div class="background-grid" [style.opacity]="opacity"></div>`,
  styles: [
    `
      .background-grid {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image:
          repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 49px,
            rgba(255, 193, 7, 0.08) 49px,
            rgba(255, 193, 7, 0.08) 50px
          ),
          repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 49px,
            rgba(255, 193, 7, 0.08) 49px,
            rgba(255, 193, 7, 0.08) 50px
          ),
          linear-gradient(
            45deg,
            transparent 48%,
            rgba(255, 193, 7, 0.03) 49%,
            rgba(255, 193, 7, 0.03) 51%,
            transparent 52%
          ),
          linear-gradient(
            -45deg,
            transparent 48%,
            rgba(255, 193, 7, 0.03) 49%,
            rgba(255, 193, 7, 0.03) 51%,
            transparent 52%
          );
        background-size:
          100% 100%,
          100% 100%,
          80px 80px,
          80px 80px;
        pointer-events: none;
      }
    `,
  ],
})
export class BackgroundGridComponent {
  @Input() opacity: number = 0.35;
}
