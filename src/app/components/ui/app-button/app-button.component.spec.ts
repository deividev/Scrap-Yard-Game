import { TestBed } from '@angular/core/testing';
import { AppButtonComponent } from './app-button.component';
import { AudioService } from '../../../services/audio.service';

class MockAudioService {
  clicks = 0;

  playUiClick(): void {
    this.clicks += 1;
  }
}

describe('AppButtonComponent', () => {
  let audioService: MockAudioService;

  beforeEach(() => {
    audioService = new MockAudioService();

    TestBed.configureTestingModule({
      providers: [{ provide: AudioService, useValue: audioService }],
    });
  });

  it('should emit clicks and play audio when enabled', async () => {
    const fixture = TestBed.createComponent(AppButtonComponent);
    let clickCount = 0;
    fixture.componentInstance.label = 'Play';
    fixture.componentInstance.variant = 'secondary';
    fixture.componentInstance.size = 'lg';
    fixture.componentInstance.clicked.subscribe(() => {
      clickCount += 1;
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(fixture.componentInstance.buttonClasses).toBe('btn-secondary btn-lg');
    expect(audioService.clicks).toBe(1);
    expect(clickCount).toBe(1);
  });

  it('should not emit clicks when disabled', async () => {
    const fixture = TestBed.createComponent(AppButtonComponent);
    let clickCount = 0;
    fixture.componentInstance.disabled = true;
    fixture.componentInstance.clicked.subscribe(() => {
      clickCount += 1;
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(button.disabled).toBe(true);
    expect(audioService.clicks).toBe(0);
    expect(clickCount).toBe(0);
  });
});