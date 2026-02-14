import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnInit {
  @Input('appTooltip') tooltipText: string = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    if (this.tooltipText) {
      this.renderer.setAttribute(this.el.nativeElement, 'title', this.tooltipText);
      this.renderer.addClass(this.el.nativeElement, 'has-tooltip');
    }
  }
}
