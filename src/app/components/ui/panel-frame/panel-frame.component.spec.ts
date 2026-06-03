import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PanelFrameComponent } from './panel-frame.component';

@Component({
  imports: [PanelFrameComponent],
  template: `
    <app-panel-frame>
      <span class="projected">content</span>
    </app-panel-frame>
  `,
})
class PanelFrameHostComponent {}

describe('PanelFrameComponent', () => {
  it('should render projected content and all frame edges and corners', () => {
    const fixture = TestBed.createComponent(PanelFrameHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.projected')?.textContent).toContain('content');
    expect(fixture.nativeElement.querySelectorAll('.pf .e-h')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('.pf .e-v')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('.pf .c')).toHaveLength(4);
  });
});