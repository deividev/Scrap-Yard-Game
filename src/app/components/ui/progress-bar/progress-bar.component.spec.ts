import { TestBed } from '@angular/core/testing';
import { ProgressBarComponent } from './progress-bar.component';

describe('ProgressBarComponent', () => {
  it('should clamp progress, expose derived state, and render inline labels', async () => {
    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('progress', 1.2);
    fixture.componentRef.setInput('label', 'Upgrading');
    fixture.componentRef.setInput('inline', true);
    fixture.componentRef.setInput('showLabel', true);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const wrapper = fixture.nativeElement.querySelector('.progress-bar-wrapper') as HTMLElement;
    const label = fixture.nativeElement.querySelector('.progress-label');

    expect(component.clampedProgress()).toBe(1);
    expect(component.widthStyle()).toBe('100%');
    expect(component.percentText()).toBe('100%');
    expect(component.isCompleting()).toBe(true);
    expect(component.isActive()).toBe(false);
    expect(wrapper.classList.contains('completing')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('100% • Upgrading');
    expect(label).toBeNull();
  });

  it('should render separate labels and active state for partial progress', async () => {
    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('progress', 0.45);
    fixture.componentRef.setInput('label', 'Processing');
    fixture.componentRef.setInput('inline', false);
    fixture.componentRef.setInput('showLabel', true);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const wrapper = fixture.nativeElement.querySelector('.progress-bar-wrapper') as HTMLElement;
    const label = fixture.nativeElement.querySelector('.progress-label') as HTMLElement;

    expect(component.widthStyle()).toBe('45%');
    expect(component.percentText()).toBe('45%');
    expect(component.isActive()).toBe(true);
    expect(wrapper.classList.contains('active')).toBe(true);
    expect(label.textContent).toContain('Processing');
  });
});