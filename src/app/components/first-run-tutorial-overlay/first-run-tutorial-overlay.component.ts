import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { FirstRunTutorialService } from '../../services/first-run-tutorial.service';
import { TranslationService } from '../../services/translation.service';

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

@Component({
  selector: 'app-first-run-tutorial-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AppButtonComponent],
  template: `
    @if (tutorialService.isActive() && currentStep()) {
      <div class="tutorial-overlay" [class.tutorial-overlay--blocking]="isModalStep()">
        @if (spotlightRect()) {
          <div
            class="tutorial-spotlight"
            [style.top.px]="spotlightRect()!.top"
            [style.left.px]="spotlightRect()!.left"
            [style.width.px]="spotlightRect()!.width"
            [style.height.px]="spotlightRect()!.height"
          ></div>
        }

        <section
          class="tutorial-panel"
          [class.tutorial-panel--modal]="isModalStep()"
          [class.tutorial-panel--floating]="!isModalStep()"
          [style.top.px]="panelPosition().top"
          [style.left.px]="panelPosition().left"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-title"
          aria-describedby="tutorial-body"
        >
          <div class="tutorial-panel__header">
            <span class="tutorial-panel__eyebrow">{{ stepCounterText() }}</span>
            <h2 id="tutorial-title" class="tutorial-panel__title">
              {{ translationService.t(currentStep()!.titleKey) }}
            </h2>
          </div>

          <p id="tutorial-body" class="tutorial-panel__body">
            {{ translationService.t(currentStep()!.bodyKey) }}
          </p>

          @if (!isManualStep()) {
            <p class="tutorial-panel__hint">
              {{ translationService.t('tutorial.waiting_for_action') }}
            </p>
          }

          <div class="tutorial-panel__footer">
            @if (!isFinalStep()) {
              <app-button
                [label]="translationService.t('tutorial.actions.skip')"
                variant="ghost"
                size="md"
                (clicked)="skipTutorial()"
              />
            }

            @if (canAdvanceManually()) {
              <app-button
                [label]="confirmLabel()"
                variant="primary"
                size="md"
                (clicked)="continueTutorial()"
              />
            }
          </div>
        </section>
      </div>
    }
  `,
  styles: [
    `
      .tutorial-overlay {
        position: fixed;
        inset: 0;
        z-index: 25000;
        pointer-events: none;
      }

      .tutorial-overlay::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at top, rgba(255, 152, 0, 0.08), transparent 38%),
          linear-gradient(180deg, rgba(3, 6, 8, 0.4), rgba(3, 6, 8, 0.5));
      }

      .tutorial-overlay--blocking {
        pointer-events: auto;
      }

      .tutorial-spotlight {
        position: absolute;
        border-radius: 16px;
        border: 2px solid rgba(255, 152, 0, 0.92);
        box-shadow:
          0 0 0 9999px rgba(0, 0, 0, 0.2),
          0 0 0 8px rgba(255, 152, 0, 0.12),
          0 0 30px rgba(255, 152, 0, 0.38);
        pointer-events: none;
        animation: tutorialPulse 1.8s ease-in-out infinite;
      }

      .tutorial-panel {
        position: fixed;
        width: min(360px, calc(100vw - 32px));
        background: linear-gradient(180deg, rgba(30, 33, 36, 0.98), rgba(16, 18, 20, 0.98));
        border: 1px solid rgba(255, 152, 0, 0.5);
        border-radius: 16px;
        box-shadow:
          0 18px 60px rgba(0, 0, 0, 0.6),
          0 0 0 1px rgba(255, 152, 0, 0.16),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
        color: var(--color-text-primary);
        padding: 18px 18px 16px;
        pointer-events: auto;
      }

      .tutorial-panel--modal {
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%);
        width: min(480px, calc(100vw - 32px));
      }

      .tutorial-panel__header {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
      }

      .tutorial-panel__eyebrow {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(255, 152, 0, 0.92);
      }

      .tutorial-panel__title {
        margin: 0;
        font-size: 22px;
        line-height: 1.15;
        color: #ffe08a;
      }

      .tutorial-panel__body {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: rgba(244, 239, 226, 0.92);
      }

      .tutorial-panel__hint {
        margin: 14px 0 0;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 152, 0, 0.14);
        font-size: 12px;
        color: var(--color-text-secondary);
      }

      .tutorial-panel__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-top: 18px;
      }

      @keyframes tutorialPulse {
        0%,
        100% {
          transform: scale(1);
        }

        50% {
          transform: scale(1.015);
        }
      }

      @media (max-width: 768px) {
        .tutorial-panel--floating {
          top: auto !important;
          left: 16px !important;
          right: 16px;
          bottom: 16px;
          width: auto;
        }

        .tutorial-panel__footer {
          flex-direction: column-reverse;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class FirstRunTutorialOverlayComponent {
  protected readonly tutorialService = inject(FirstRunTutorialService);
  protected readonly translationService = inject(TranslationService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly viewportSize = signal({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  });
  private readonly spotlightRectSignal = signal<SpotlightRect | null>(null);
  private lastScrolledTargetId: string | null = null;

  protected readonly currentStep = this.tutorialService.currentStep;
  protected readonly spotlightRect = this.spotlightRectSignal.asReadonly();

  protected readonly isManualStep = computed(
    () => this.currentStep()?.completionRule.kind === 'manual',
  );
  protected readonly canAdvanceManually = computed(() => {
    const currentStep = this.currentStep();
    return (
      currentStep?.completionRule.kind === 'manual' || currentStep?.allowManualAdvance === true
    );
  });
  protected readonly isModalStep = computed(() => {
    const step = this.currentStep();
    return !step || step.presentation === 'modal';
  });
  protected readonly isFinalStep = computed(() => this.currentStep()?.id === 'complete');
  protected readonly stepCounterText = computed(() => {
    const currentStep = this.currentStep();
    if (!currentStep) {
      return '';
    }

    return this.translationService.tp('tutorial.step_counter', {
      current: currentStep.order,
      total: this.tutorialService.steps.length,
    });
  });
  protected readonly confirmLabel = computed(() => {
    const currentStep = this.currentStep();
    if (!currentStep?.confirmKey) {
      return this.translationService.t('tutorial.actions.continue');
    }

    return this.translationService.t(currentStep.confirmKey);
  });
  protected readonly panelPosition = computed(() => {
    const rect = this.spotlightRect();
    const viewport = this.viewportSize();

    if (!rect || this.isModalStep()) {
      return {
        top: Math.max(24, viewport.height / 2 - 160),
        left: Math.max(16, viewport.width / 2 - 180),
      };
    }

    const gap = 18;
    const preferredLeft = rect.left + rect.width + gap;
    const fitsRight = preferredLeft + 360 <= viewport.width - 16;
    const left = fitsRight ? preferredLeft : Math.max(16, rect.left - 378);
    const top = Math.min(Math.max(16, rect.top + rect.height / 2 - 110), viewport.height - 220);

    return { top, left };
  });

  private readonly syncEffect = effect((onCleanup) => {
    if (!this.tutorialService.isActive()) {
      this.spotlightRectSignal.set(null);
      return;
    }

    const syncTarget = () => {
      this.viewportSize.set({
        width: typeof window !== 'undefined' ? window.innerWidth : 1280,
        height: typeof window !== 'undefined' ? window.innerHeight : 720,
      });

      const targetId = this.currentStep()?.targetId;
      if (!targetId || typeof document === 'undefined') {
        this.spotlightRectSignal.set(null);
        return;
      }

      const element = document.querySelector<HTMLElement>(`[data-tutorial-id="${targetId}"]`);
      if (!element) {
        this.spotlightRectSignal.set(null);
        return;
      }

      // Scroll element into view once per step change so it is always on screen
      if (targetId !== this.lastScrolledTargetId) {
        this.lastScrolledTargetId = targetId;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      const rect = element.getBoundingClientRect();
      const padding = 8;
      const minSize = 48;
      const rawWidth = rect.width + padding * 2;
      const rawHeight = rect.height + padding * 2;
      const finalWidth = Math.max(minSize, rawWidth);
      const finalHeight = Math.max(minSize, rawHeight);
      // Re-center the spotlight box if we had to expand it
      const leftAdjust = (finalWidth - rawWidth) / 2;
      const topAdjust = (finalHeight - rawHeight) / 2;
      this.spotlightRectSignal.set({
        top: Math.max(8, rect.top - padding - topAdjust),
        left: Math.max(8, rect.left - padding - leftAdjust),
        width: finalWidth,
        height: finalHeight,
      });
    };

    syncTarget();

    if (typeof window === 'undefined') {
      return;
    }

    const intervalId = window.setInterval(syncTarget, 200);
    const resizeHandler = () => syncTarget();
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('scroll', resizeHandler, true);

    onCleanup(() => {
      window.clearInterval(intervalId);
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('scroll', resizeHandler, true);
    });
  });

  protected continueTutorial(): void {
    this.tutorialService.acknowledgeCurrentStep();
  }

  protected skipTutorial(): void {
    this.tutorialService.skipTutorial();
  }

  @HostListener('keydown.tab', ['$event'])
  @HostListener('keydown.shift.tab', ['$event'])
  protected trapFocus(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (!this.isModalStep()) return;
    const dialog = this.elementRef.nativeElement.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (keyEvent.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        keyEvent.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        keyEvent.preventDefault();
      }
    }
  }
}
