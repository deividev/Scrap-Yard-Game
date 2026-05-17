import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PanelFrameHComponent } from './panel-frame-h.component';

@Component({
  imports: [PanelFrameHComponent],
  template: `
    <app-panel-frame-h>
      <span class="projected">header</span>
    </app-panel-frame-h>
  `,
})
class PanelFrameHHostComponent {}

describe('PanelFrameHComponent', () => {
  it('should render projected content and all horizontal frame pieces', () => {
    const fixture = TestBed.createComponent(PanelFrameHHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.projected')?.textContent).toContain('header');
    expect(fixture.nativeElement.querySelectorAll('.pfh .e-h')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('.pfh .e-v')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('.pfh .c')).toHaveLength(4);
  });
});