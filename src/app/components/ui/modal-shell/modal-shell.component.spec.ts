import { TestBed } from '@angular/core/testing';
import { ModalShellComponent } from './modal-shell.component';

describe('ModalShellComponent', () => {
  it('should render bars and dismiss when clicking the backdrop if allowed', async () => {
    const fixture = TestBed.createComponent(ModalShellComponent);
    let dismissed = 0;
    fixture.componentRef.setInput('showTopBar', true);
    fixture.componentRef.setInput('showBottomBar', true);
    fixture.componentRef.setInput('backdropDismissable', true);
    fixture.componentRef.setInput('labelledBy', 'modal-title');
    fixture.componentRef.setInput('zIndex', 30000);
    fixture.componentRef.setInput('maxWidth', '600px');
    fixture.componentInstance.dismissed.subscribe(() => {
      dismissed += 1;
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.ms-backdrop') as HTMLElement;
    backdrop.click();

    expect(fixture.nativeElement.querySelector('.ms-top-bar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ms-bottom-bar')).not.toBeNull();
    expect(backdrop.getAttribute('aria-labelledby')).toBe('modal-title');
    expect(backdrop.style.zIndex).toBe('30000');
    expect((fixture.nativeElement.querySelector('.ms-panel') as HTMLElement).style.maxWidth).toBe('600px');
    expect(dismissed).toBe(1);
  });

  it('should not dismiss when backdrop dismiss is disabled', async () => {
    const fixture = TestBed.createComponent(ModalShellComponent);
    let dismissed = 0;
    fixture.componentInstance.dismissed.subscribe(() => {
      dismissed += 1;
    });
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.ms-backdrop') as HTMLElement).click();

    expect(dismissed).toBe(0);
  });
});