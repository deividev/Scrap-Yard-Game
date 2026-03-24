import { TestBed } from '@angular/core/testing';
import { FirstRunTutorialOverlayComponent } from './first-run-tutorial-overlay.component';
import { FirstRunTutorialService } from '../../services/first-run-tutorial.service';

describe('FirstRunTutorialOverlayComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirstRunTutorialOverlayComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the welcome step when tutorial starts', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    const tutorialService = TestBed.inject(FirstRunTutorialService);

    tutorialService.startIfNeeded();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.tutorial-panel')).not.toBeNull();
    expect(element.textContent).toContain('Puesta en marcha');
  });
});