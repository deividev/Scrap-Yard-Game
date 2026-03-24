import { Injectable, computed, inject, signal } from '@angular/core';
import { FIRST_RUN_TUTORIAL_STEPS } from '../config/first-run-tutorial.config';
import {
  FirstRunTutorialState,
  TutorialEventId,
  TutorialStep,
  TutorialStepId,
  createDefaultFirstRunTutorialState,
} from '../models/tutorial-step.model';
import { ResourcesService } from './resources.service';

type SaveMarker = {
  markDirty(): void;
};

@Injectable({
  providedIn: 'root',
})
export class FirstRunTutorialService {
  private resourcesService = inject(ResourcesService);
  private state = signal<FirstRunTutorialState>(createDefaultFirstRunTutorialState());
  private saveService?: SaveMarker;

  readonly steps = FIRST_RUN_TUTORIAL_STEPS;

  readonly isActive = computed(() => this.state().isActive);
  readonly isCompleted = computed(() => this.state().isCompleted);
  readonly isSkipped = computed(() => this.state().isSkipped);
  readonly currentStepId = computed(() => this.state().currentStepId);
  readonly currentStep = computed(() => {
    const currentStepId = this.state().currentStepId;
    return currentStepId
      ? this.steps.find((step) => step.id === currentStepId) ?? null
      : null;
  });
  readonly progress = computed(() => {
    const completedSteps = this.state().seenStepIds.length;
    return this.steps.length === 0 ? 0 : completedSteps / this.steps.length;
  });

  setSaveService(saveService: SaveMarker): void {
    this.saveService = saveService;
  }

  startIfNeeded(): void {
    const currentState = this.state();

    if (currentState.isCompleted || currentState.isSkipped || currentState.isActive) {
      return;
    }

    this.state.update((state) => ({
      ...state,
      isActive: true,
      currentStepId: state.currentStepId ?? this.steps[0]?.id ?? null,
    }));

    this.markDirty();
    this.advanceWhileCurrentStepIsAlreadySatisfied();
  }

  acknowledgeCurrentStep(): void {
    const currentStep = this.currentStep();
    if (
      !currentStep ||
      (currentStep.completionRule.kind !== 'manual' && currentStep.allowManualAdvance !== true)
    ) {
      return;
    }

    if (currentStep.id === 'complete') {
      this.completeTutorial();
      return;
    }

    this.advanceToNextStep();
  }

  recordEvent(eventId: TutorialEventId): void {
    if (this.state().flags[eventId]) {
      this.advanceWhileCurrentStepIsAlreadySatisfied();
      return;
    }

    this.state.update((state) => ({
      ...state,
      flags: {
        ...state.flags,
        [eventId]: true,
      },
    }));

    this.markDirty();
    this.advanceWhileCurrentStepIsAlreadySatisfied();
  }

  skipTutorial(): void {
    this.state.update((state) => ({
      ...state,
      isActive: false,
      isSkipped: true,
      currentStepId: null,
    }));
    this.markDirty();
  }

  completeTutorial(): void {
    this.state.update((state) => ({
      ...state,
      isActive: false,
      isCompleted: true,
      currentStepId: null,
      seenStepIds: this.steps.map((step) => step.id),
    }));
    this.markDirty();
  }

  reset(markDirty = false): void {
    this.state.set(createDefaultFirstRunTutorialState());
    if (markDirty) {
      this.markDirty();
    }
  }

  hydrate(savedState?: FirstRunTutorialState): void {
    if (!savedState) {
      this.state.set(createDefaultFirstRunTutorialState());
      return;
    }

    const validStepIds = new Set<TutorialStepId>(this.steps.map((step) => step.id));
    const nextState = createDefaultFirstRunTutorialState();

    nextState.isActive = savedState.isActive === true;
    nextState.isCompleted = savedState.isCompleted === true;
    nextState.isSkipped = savedState.isSkipped === true;
    nextState.currentStepId = validStepIds.has(savedState.currentStepId as TutorialStepId)
      ? savedState.currentStepId
      : null;
    nextState.seenStepIds = (savedState.seenStepIds ?? []).filter((stepId) => validStepIds.has(stepId));
    nextState.flags = {
      ...nextState.flags,
      ...(savedState.flags ?? {}),
    };

    this.state.set(nextState);
    this.advanceWhileCurrentStepIsAlreadySatisfied();
  }

  serialize(): FirstRunTutorialState {
    return this.state();
  }

  private advanceWhileCurrentStepIsAlreadySatisfied(): void {
    let guard = 0;

    while (guard < this.steps.length) {
      const currentStep = this.currentStep();
      if (!currentStep || !this.isStepSatisfied(currentStep)) {
        return;
      }

      if (currentStep.id === 'complete') {
        this.completeTutorial();
        return;
      }

      this.advanceToNextStep();
      guard += 1;
    }
  }

  private advanceToNextStep(): void {
    const currentStepId = this.state().currentStepId;
    const currentIndex = this.steps.findIndex((step) => step.id === currentStepId);
    const nextStep = currentIndex >= 0 ? this.steps[currentIndex + 1] : this.steps[0];

    this.state.update((state) => ({
      ...state,
      isActive: nextStep ? state.isActive : false,
      currentStepId: nextStep?.id ?? null,
      seenStepIds: currentStepId
        ? Array.from(new Set([...state.seenStepIds, currentStepId]))
        : state.seenStepIds,
    }));

    if (!nextStep) {
      this.completeTutorial();
      return;
    }

    this.markDirty();
  }

  private isStepSatisfied(step: TutorialStep): boolean {
    const currentState = this.state();

    switch (step.completionRule.kind) {
      case 'manual':
        return false;
      case 'event':
        return currentState.flags[step.completionRule.eventId];
      case 'resource-threshold':
        return (
          this.resourcesService.getAmount(step.completionRule.resourceId) >=
          step.completionRule.minimumAmount
        );
      default:
        return false;
    }
  }

  private markDirty(): void {
    this.saveService?.markDirty();
  }
}