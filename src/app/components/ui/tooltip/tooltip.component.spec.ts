import { TestBed } from '@angular/core/testing';
import { TooltipComponent } from './tooltip.component';

describe('TooltipComponent', () => {
  it('should render tooltip text and wide lines when enabled', async () => {
    const fixture = TestBed.createComponent(TooltipComponent);
    fixture.componentInstance.text = 'line one\nline two';
    fixture.componentInstance.wide = true;
    fixture.componentInstance.position = 'top-right';
    fixture.componentInstance.inline = true;
    await fixture.whenStable();
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.tooltip-wrapper') as HTMLElement;
    const content = fixture.nativeElement.querySelector('.tooltip-content') as HTMLElement;
    const lines = Array.from(fixture.nativeElement.querySelectorAll('.tooltip-line')) as HTMLElement[];

    expect(wrapper.classList.contains('inline')).toBe(true);
    expect(wrapper.getAttribute('data-tooltip')).toBe('line one\nline two');
    expect(content.classList.contains('tooltip-top-right')).toBe(true);
    expect(content.classList.contains('tooltip-wide')).toBe(true);
    expect(lines.map((line) => line.textContent?.trim())).toEqual(['line one', 'line two']);
    expect(fixture.componentInstance.lines).toEqual(['line one', 'line two']);
  });

  it('should suppress tooltip content when disabled', async () => {
    const fixture = TestBed.createComponent(TooltipComponent);
    fixture.componentInstance.text = 'hidden';
    fixture.componentInstance.disabled = true;
    await fixture.whenStable();
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.tooltip-wrapper') as HTMLElement;

    expect(wrapper.getAttribute('data-tooltip')).toBeNull();
    expect(fixture.nativeElement.querySelector('.tooltip-content')).toBeNull();
  });
});