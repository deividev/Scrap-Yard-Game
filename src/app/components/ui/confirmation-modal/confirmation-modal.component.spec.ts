import { TestBed } from '@angular/core/testing';
import { ConfirmationModalComponent } from './confirmation-modal.component';
import { TranslationService } from '../../../services/translation.service';
import { AudioService } from '../../../services/audio.service';

class MockTranslationService {
  t(key: string): string {
    return key;
  }
}

class MockAudioService {
  playUiClick(): void {}
}

describe('ConfirmationModalComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: AudioService, useClass: MockAudioService },
      ],
    });
  });

  it('should render translated keys and emit confirm and cancel actions', async () => {
    const fixture = TestBed.createComponent(ConfirmationModalComponent);
    let confirmed = 0;
    let cancelled = 0;
    fixture.componentRef.setInput('titleKey', 'modal.title');
    fixture.componentRef.setInput('messageKey', 'modal.message');
    fixture.componentRef.setInput('confirmLabelKey', 'modal.confirm');
    fixture.componentRef.setInput('cancelLabelKey', 'modal.cancel');
    fixture.componentRef.setInput('confirmVariant', 'ghost');
    fixture.componentInstance.confirmed.subscribe(() => {
      confirmed += 1;
    });
    fixture.componentInstance.cancelled.subscribe(() => {
      cancelled += 1;
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons[0].click();
    buttons[1].click();

    expect(fixture.nativeElement.textContent).toContain('modal.title');
    expect(fixture.nativeElement.textContent).toContain('modal.message');
    expect(fixture.nativeElement.textContent).toContain('modal.confirm');
    expect(fixture.nativeElement.textContent).toContain('modal.cancel');
    expect(confirmed).toBe(1);
    expect(cancelled).toBe(1);
  });

  it('should emit cancel when the modal shell is dismissed from the backdrop', async () => {
    const fixture = TestBed.createComponent(ConfirmationModalComponent);
    let cancelled = 0;

    fixture.componentInstance.cancelled.subscribe(() => {
      cancelled += 1;
    });

    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.ms-backdrop') as HTMLDivElement).click();

    expect(cancelled).toBe(1);
  });
});