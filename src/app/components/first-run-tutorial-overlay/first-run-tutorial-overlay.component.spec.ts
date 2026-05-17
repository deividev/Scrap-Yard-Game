import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { FirstRunTutorialOverlayComponent } from './first-run-tutorial-overlay.component';
import { FirstRunTutorialService } from '../../services/first-run-tutorial.service';
import { TranslationService } from '../../services/translation.service';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { FIRST_RUN_TUTORIAL_STEPS } from '../../config/first-run-tutorial.config';
import { TutorialStep, TutorialStepId } from '../../models/tutorial-step.model';

@Component({
  selector: 'app-button',
  template: '<button class="app-button-stub" type="button" (click)="clicked.emit()">{{ label() }}</button>',
})
class StubAppButtonComponent {
  label = input<string>('');
  clicked = output<void>();
}

class MockFirstRunTutorialService {
  private activeSignal = signal(false);
  private currentStepSignal = signal<TutorialStep | null>(null);

  readonly steps = FIRST_RUN_TUTORIAL_STEPS;
  readonly isActive = this.activeSignal.asReadonly();
  readonly currentStep = this.currentStepSignal.asReadonly();

  acknowledgeCalls = 0;
  skipCalls = 0;

  setStep(stepId: TutorialStepId | null): void {
    const step = this.steps.find((candidate) => candidate.id === stepId) ?? null;
    this.currentStepSignal.set(step);
    this.activeSignal.set(step !== null);
  }

  setCustomStep(step: TutorialStep | null): void {
    this.currentStepSignal.set(step);
    this.activeSignal.set(step !== null);
  }

  acknowledgeCurrentStep(): void {
    this.acknowledgeCalls += 1;
  }

  skipTutorial(): void {
    this.skipCalls += 1;
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }

  tp(key: string, params: Record<string, string | number>): string {
    return `${key}:${params['current'] ?? ''}:${params['total'] ?? ''}`;
  }
}

describe('FirstRunTutorialOverlayComponent', () => {
  let tutorialService: MockFirstRunTutorialService;

  beforeEach(() => {
    vi.useFakeTimers();
    tutorialService = new MockFirstRunTutorialService();

    TestBed.configureTestingModule({
      imports: [FirstRunTutorialOverlayComponent],
      providers: [
        { provide: FirstRunTutorialService, useValue: tutorialService },
        { provide: TranslationService, useClass: MockTranslationService },
      ],
    }).overrideComponent(FirstRunTutorialOverlayComponent, {
      remove: { imports: [AppButtonComponent] },
      add: { imports: [StubAppButtonComponent] },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.querySelectorAll('[data-tutorial-id="scrap-button"]').forEach((element) => element.remove());
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should stay hidden while the tutorial is inactive', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.tutorial-overlay')).toBeNull();
    expect((fixture.componentInstance as any).stepCounterText()).toBe('');
  });

  it('should render the modal welcome step and wire continue and skip actions', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('welcome');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(element.querySelectorAll('.app-button-stub')) as HTMLButtonElement[];

    buttons[1].click();
    buttons[0].click();

    expect(element.querySelector('.tutorial-panel')).not.toBeNull();
    expect(element.querySelector('.tutorial-overlay--blocking')).not.toBeNull();
    expect(element.textContent).toContain('tutorial.actions.start');
    expect(element.textContent).toContain('tutorial.actions.skip');
    expect(tutorialService.acknowledgeCalls).toBe(1);
    expect(tutorialService.skipCalls).toBe(1);
  });

  it('should render spotlight positioning and waiting hint for a spotlight step target', () => {
    const target = document.createElement('button');
    target.setAttribute('data-tutorial-id', 'scrap-button');
    target.scrollIntoView = vi.fn();
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      x: 50,
      y: 100,
      top: 100,
      left: 50,
      right: 90,
      bottom: 120,
      width: 40,
      height: 20,
      toJSON: () => ({}),
    } as DOMRect);
    document.body.appendChild(target);

    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('generate-scrap');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.tutorial-spotlight')).not.toBeNull();
    expect(element.querySelector('.tutorial-panel--floating')).not.toBeNull();
    expect(element.textContent).toContain('tutorial.waiting_for_action');
    expect(element.querySelectorAll('.app-button-stub')).toHaveLength(1);
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect((fixture.componentInstance as any).panelPosition().left).toBeGreaterThan(100);
  });

  it('should render the final modal step without skip and use the final confirm label', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('complete');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(element.querySelectorAll('.app-button-stub')) as HTMLButtonElement[];

    expect(element.querySelector('.tutorial-panel--modal')).not.toBeNull();
    expect(element.textContent).toContain('tutorial.actions.close');
    expect(element.textContent).not.toContain('tutorial.actions.skip');
    expect((fixture.componentInstance as any).isFinalStep()).toBe(true);
    expect((fixture.componentInstance as any).canAdvanceManually()).toBe(true);

    buttons[0].click();

    expect(tutorialService.acknowledgeCalls).toBe(1);
  });

  it('should render inline manual steps with both actions and without the waiting hint', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('check-next-goal');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(element.querySelectorAll('.app-button-stub')) as HTMLButtonElement[];

    expect(element.querySelector('.tutorial-panel--floating')).not.toBeNull();
    expect(element.textContent).not.toContain('tutorial.waiting_for_action');
    expect(element.textContent).toContain('tutorial.actions.finish');
    expect(element.textContent).toContain('tutorial.actions.skip');
    expect(buttons).toHaveLength(2);
  });

  it('should allow manual advance on custom event steps with allowManualAdvance enabled', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setCustomStep({
      id: 'custom-step' as TutorialStepId,
      order: 10,
      presentation: 'spotlight',
      titleKey: 'tutorial.custom.title',
      bodyKey: 'tutorial.custom.body',
      confirmKey: 'tutorial.custom.confirm',
      targetId: 'scrap-button',
      allowManualAdvance: true,
      completionRule: { kind: 'event', eventId: 'manual-scrap-generated' },
    });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(element.querySelectorAll('.app-button-stub')) as HTMLButtonElement[];

    expect(element.textContent).toContain('tutorial.waiting_for_action');
    expect(element.textContent).toContain('tutorial.custom.confirm');
    expect(buttons).toHaveLength(2);

    buttons[1].click();

    expect(tutorialService.acknowledgeCalls).toBe(1);
  });

  it('should handle spotlight steps without a matching target and early-return focus trapping outside modal steps', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('activate-crusher');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const preventDefault = vi.fn();
    (fixture.componentInstance as any).trapFocus({ shiftKey: false, preventDefault } as unknown as KeyboardEvent);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.tutorial-spotlight')).toBeNull();
    expect(element.querySelector('.tutorial-panel--floating')).not.toBeNull();
    expect(element.textContent).toContain('tutorial.waiting_for_action');
    expect((fixture.componentInstance as any).spotlightRect()).toBeNull();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should resize and clamp the spotlight box for tiny targets', () => {
    const target = document.createElement('button');
    target.setAttribute('data-tutorial-id', 'scrap-button');
    target.scrollIntoView = vi.fn();

    const rectSpy = vi.spyOn(target, 'getBoundingClientRect');
    rectSpy.mockReturnValue({
      x: 2,
      y: 4,
      top: 4,
      left: 2,
      right: 12,
      bottom: 14,
      width: 10,
      height: 10,
      toJSON: () => ({}),
    } as DOMRect);
    document.body.appendChild(target);

    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('generate-scrap');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    let spotlight = (fixture.componentInstance as any).spotlightRect();
    expect(spotlight.width).toBe(48);
    expect(spotlight.height).toBe(48);
    expect(spotlight.left).toBe(8);
    expect(spotlight.top).toBe(8);

    rectSpy.mockReturnValue({
      x: 100,
      y: 160,
      top: 160,
      left: 100,
      right: 180,
      bottom: 220,
      width: 80,
      height: 60,
      toJSON: () => ({}),
    } as DOMRect);

    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();

    spotlight = (fixture.componentInstance as any).spotlightRect();
    expect(spotlight.left).toBe(92);
    expect(spotlight.top).toBe(152);
    expect(spotlight.width).toBe(96);
    expect(spotlight.height).toBe(76);
  });

  it('should only scroll once per target and scroll again after the target changes', () => {
    const scrapTarget = document.createElement('button');
    scrapTarget.setAttribute('data-tutorial-id', 'scrap-button');
    scrapTarget.scrollIntoView = vi.fn();
    vi.spyOn(scrapTarget, 'getBoundingClientRect').mockReturnValue({
      x: 40,
      y: 60,
      top: 60,
      left: 40,
      right: 100,
      bottom: 120,
      width: 60,
      height: 60,
      toJSON: () => ({}),
    } as DOMRect);
    document.body.appendChild(scrapTarget);

    const crusherTarget = document.createElement('button');
    crusherTarget.setAttribute('data-tutorial-id', 'machine-toggle-crusher');
    crusherTarget.scrollIntoView = vi.fn();
    vi.spyOn(crusherTarget, 'getBoundingClientRect').mockReturnValue({
      x: 120,
      y: 180,
      top: 180,
      left: 120,
      right: 180,
      bottom: 240,
      width: 60,
      height: 60,
      toJSON: () => ({}),
    } as DOMRect);
    document.body.appendChild(crusherTarget);

    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('generate-scrap');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();

    expect(scrapTarget.scrollIntoView).toHaveBeenCalledTimes(1);

    tutorialService.setStep('activate-crusher');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(crusherTarget.scrollIntoView).toHaveBeenCalledTimes(1);

    crusherTarget.remove();
  });

  it('should trap focus inside the modal dialog when tabbing', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('welcome');
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.app-button-stub'),
    ) as HTMLButtonElement[];
    const first = buttons[0];
    const last = buttons[1];
    const preventDefault = vi.fn();

    first.focus();
    (fixture.componentInstance as any).trapFocus({ shiftKey: true, preventDefault } as unknown as KeyboardEvent);
    expect(document.activeElement).toBe(last);

    last.focus();
    (fixture.componentInstance as any).trapFocus({ shiftKey: false, preventDefault } as unknown as KeyboardEvent);
    expect(document.activeElement).toBe(first);
    expect(preventDefault).toHaveBeenCalled();
  });

  it('should react to real tab keyboard events through the host listeners', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('welcome');
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.app-button-stub'),
    ) as HTMLButtonElement[];
    const first = buttons[0];
    const last = buttons[1];

    last.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
    fixture.nativeElement.dispatchEvent(tabEvent);

    expect(document.activeElement).toBe(first);
    expect(preventDefaultSpy).toHaveBeenCalled();

    first.focus();
    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    const shiftPreventDefaultSpy = vi.spyOn(shiftTabEvent, 'preventDefault');
    fixture.nativeElement.dispatchEvent(shiftTabEvent);

    expect(document.activeElement).toBe(last);
    expect(shiftPreventDefaultSpy).toHaveBeenCalled();
  });

  it('should use the default continue label and step counter when a manual custom step has no confirm key', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setCustomStep({
      id: 'manual-custom' as TutorialStepId,
      order: 3,
      presentation: 'modal',
      titleKey: 'tutorial.custom.title',
      bodyKey: 'tutorial.custom.body',
      completionRule: { kind: 'manual' },
    });
    fixture.detectChanges();

    expect((fixture.componentInstance as any).confirmLabel()).toBe('tutorial.actions.continue');
    expect((fixture.componentInstance as any).stepCounterText()).toBe(
      `tutorial.step_counter:3:${FIRST_RUN_TUTORIAL_STEPS.length}`,
    );
  });

  it('should use the centered modal panel fallback position when there is no spotlight target', () => {
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 800);

    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('welcome');
    fixture.detectChanges();

    expect((fixture.componentInstance as any).spotlightRect()).toBeNull();
    expect((fixture.componentInstance as any).panelPosition()).toEqual({
      top: 240,
      left: 320,
    });
  });

  it('should leave focus trapping idle when a modal step renders no focusable controls', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setCustomStep({
      id: 'complete' as TutorialStepId,
      order: 9,
      presentation: 'modal',
      titleKey: 'tutorial.custom.title',
      bodyKey: 'tutorial.custom.body',
      completionRule: { kind: 'event', eventId: 'manual-scrap-generated' },
    });
    fixture.detectChanges();

    const preventDefault = vi.fn();
    (fixture.componentInstance as any).trapFocus({ shiftKey: false, preventDefault } as unknown as KeyboardEvent);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.tutorial-panel--modal')).not.toBeNull();
    expect(element.textContent).toContain('tutorial.waiting_for_action');
    expect(element.querySelectorAll('.app-button-stub')).toHaveLength(0);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should place the floating panel to the left and clamp it near the viewport bottom when there is no room on the right', () => {
    const target = document.createElement('button');
    target.setAttribute('data-tutorial-id', 'scrap-button');
    target.scrollIntoView = vi.fn();
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      x: 980,
      y: 760,
      top: 760,
      left: 980,
      right: 1080,
      bottom: 860,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    } as DOMRect);
    document.body.appendChild(target);

    vi.stubGlobal('innerWidth', 1200);
    vi.stubGlobal('innerHeight', 900);

    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('generate-scrap');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect((fixture.componentInstance as any).panelPosition()).toEqual({
      top: 680,
      left: 594,
    });
  });

  it('should clear the sync interval and remove listeners when destroyed', () => {
    const target = document.createElement('button');
    target.setAttribute('data-tutorial-id', 'scrap-button');
    target.scrollIntoView = vi.fn();
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      x: 40,
      y: 60,
      top: 60,
      left: 40,
      right: 100,
      bottom: 120,
      width: 60,
      height: 60,
      toJSON: () => ({}),
    } as DOMRect);
    document.body.appendChild(target);

    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('generate-scrap');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    fixture.destroy();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
  });

  it('should clear the spotlight and hide the overlay when the tutorial becomes inactive', () => {
    const target = document.createElement('button');
    target.setAttribute('data-tutorial-id', 'scrap-button');
    target.scrollIntoView = vi.fn();
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      x: 50,
      y: 100,
      top: 100,
      left: 50,
      right: 90,
      bottom: 120,
      width: 40,
      height: 20,
      toJSON: () => ({}),
    } as DOMRect);
    document.body.appendChild(target);

    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('generate-scrap');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect((fixture.componentInstance as any).spotlightRect()).not.toBeNull();

    tutorialService.setStep(null);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect((fixture.componentInstance as any).spotlightRect()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.tutorial-overlay')).toBeNull();
  });

  it('should leave modal focus trapping idle when the dialog element is missing', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('welcome');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[role="dialog"]')?.remove();

    const preventDefault = vi.fn();
    (fixture.componentInstance as any).trapFocus({ shiftKey: false, preventDefault } as unknown as KeyboardEvent);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should not wrap focus inside the modal when the active element is not at either edge', () => {
    const fixture = TestBed.createComponent(FirstRunTutorialOverlayComponent);
    tutorialService.setStep('welcome');
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const footer = dialog.querySelector('.tutorial-panel__footer') as HTMLElement;
    const footerChildren = Array.from(footer.children);
    const middleButton = document.createElement('button');
    middleButton.type = 'button';
    middleButton.textContent = 'middle';
    footer.insertBefore(middleButton, footerChildren[footerChildren.length - 1]);

    const preventDefault = vi.fn();

    middleButton.focus();
    (fixture.componentInstance as any).trapFocus({ shiftKey: true, preventDefault } as unknown as KeyboardEvent);
    (fixture.componentInstance as any).trapFocus({ shiftKey: false, preventDefault } as unknown as KeyboardEvent);

    expect(document.activeElement).toBe(middleButton);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
