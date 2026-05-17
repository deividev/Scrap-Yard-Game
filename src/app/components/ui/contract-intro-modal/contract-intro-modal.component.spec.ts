import { TestBed } from '@angular/core/testing';
import { ContractIntroModalComponent } from './contract-intro-modal.component';
import { TranslationService } from '../../../services/translation.service';
import { AudioService } from '../../../services/audio.service';

class MockTranslationService {
  t(key: string): string {
    const map: Record<string, string> = {
      'contracts.intro.title': 'Contracts available',
      'contracts.intro.body_1': '<strong>Body 1</strong>',
      'contracts.intro.body_2': 'Line A\nLine B',
      'contracts.intro.body_3': '<strong>Body 3</strong>',
      'contracts.intro.dismiss': 'Dismiss',
    };

    return map[key] ?? key;
  }
}

class MockAudioService {
  playUiClick(): void {}
}

describe('ContractIntroModalComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: AudioService, useClass: MockAudioService },
      ],
    });
  });

  it('should render intro content, split bullet lines, and emit dismiss', async () => {
    const fixture = TestBed.createComponent(ContractIntroModalComponent);
    let dismissed = 0;
    fixture.componentInstance.dismissed.subscribe(() => {
      dismissed += 1;
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const lines = Array.from(fixture.nativeElement.querySelectorAll('.cim-list li')) as HTMLElement[];
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(fixture.nativeElement.textContent).toContain('Contracts available');
    expect(fixture.nativeElement.textContent).toContain('Dismiss');
    expect(lines.map((line) => line.textContent?.trim())).toEqual(['Line A', 'Line B']);
    expect(dismissed).toBe(1);
  });
});