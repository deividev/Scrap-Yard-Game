import { TestBed } from '@angular/core/testing';
import { FirstRunTutorialService } from './first-run-tutorial.service';
import { ResourcesService } from './resources.service';
import { ResourceType } from '../models/resource.model';
import { DEFAULT_TUTORIAL_EVENT_FLAGS } from '../models/tutorial-step.model';

class MockResourcesService {
  private amounts: Record<string, number> = {
    [ResourceType.METAL]: 0,
  };

  getAmount(resourceId: string): number {
    return this.amounts[resourceId] ?? 0;
  }

  setAmount(resourceId: string, amount: number): void {
    this.amounts[resourceId] = amount;
  }
}

describe('FirstRunTutorialService', () => {
  let service: FirstRunTutorialService;
  let resourcesService: MockResourcesService;
  let dirtyCalls: number;

  beforeEach(() => {
    resourcesService = new MockResourcesService();
    dirtyCalls = 0;

    TestBed.configureTestingModule({
      providers: [
        FirstRunTutorialService,
        { provide: ResourcesService, useValue: resourcesService },
      ],
    });

    service = TestBed.inject(FirstRunTutorialService);
    service.setSaveService({
      markDirty: () => {
        dirtyCalls += 1;
      },
    });
  });

  it('should start on the welcome step and advance through manual or event-driven steps', () => {
    service.startIfNeeded();

    expect(service.isActive()).toBe(true);
    expect(service.currentStepId()).toBe('welcome');

    service.acknowledgeCurrentStep();
    expect(service.currentStepId()).toBe('generate-scrap');

    service.recordEvent('manual-scrap-generated');
    expect(service.currentStepId()).toBe('activate-crusher');
    expect(service.progress()).toBeGreaterThan(0);
    expect(dirtyCalls).toBeGreaterThan(0);
  });

  it('should skip and complete the tutorial correctly', () => {
    service.startIfNeeded();
    service.skipTutorial();

    expect(service.isActive()).toBe(false);
    expect(service.isSkipped()).toBe(true);

    service.reset();
    service.completeTutorial();

    expect(service.isCompleted()).toBe(true);
    expect(service.currentStepId()).toBeNull();
    expect(service.serialize().seenStepIds).toHaveLength(service.steps.length);
  });

  it('should hydrate safely and auto-advance when the saved step is already satisfied', () => {
    service.hydrate({
      isActive: true,
      isCompleted: false,
      isSkipped: false,
      currentStepId: 'generate-scrap',
      seenStepIds: ['welcome', 'invalid-step' as never],
      flags: {
        'manual-scrap-generated': true,
        'crusher-activated': false,
        'crusher-cycle-completed': false,
        'metal-sold': false,
        'first-upgrade-purchased': false,
      },
    });

    expect(service.currentStepId()).toBe('activate-crusher');
    expect(service.serialize().seenStepIds).toContain('generate-scrap');
  });

  it('should ignore redundant starts, non-manual acknowledgements, and duplicate events', () => {
    service.startIfNeeded();
    expect(service.currentStepId()).toBe('welcome');
    expect(dirtyCalls).toBe(1);

    service.startIfNeeded();
    expect(service.currentStepId()).toBe('welcome');
    expect(dirtyCalls).toBe(1);

    service.acknowledgeCurrentStep();
    expect(service.currentStepId()).toBe('generate-scrap');
    expect(dirtyCalls).toBe(2);

    service.acknowledgeCurrentStep();
    expect(service.currentStepId()).toBe('generate-scrap');
    expect(dirtyCalls).toBe(2);

    service.recordEvent('manual-scrap-generated');
    expect(service.currentStepId()).toBe('activate-crusher');
    expect(dirtyCalls).toBe(4);

    service.recordEvent('manual-scrap-generated');
    expect(service.currentStepId()).toBe('activate-crusher');
    expect(dirtyCalls).toBe(4);
  });

  it('should respect skipped and completed guards and optionally mark reset as dirty', () => {
    service.startIfNeeded();
    service.skipTutorial();

    expect(service.isActive()).toBe(false);
    expect(service.isSkipped()).toBe(true);
    expect(dirtyCalls).toBe(2);

    service.startIfNeeded();
    expect(service.isActive()).toBe(false);
    expect(service.currentStepId()).toBeNull();
    expect(dirtyCalls).toBe(2);

    service.reset(true);
    expect(service.isSkipped()).toBe(false);
    expect(service.isCompleted()).toBe(false);
    expect(service.currentStepId()).toBeNull();
    expect(dirtyCalls).toBe(3);

    service.completeTutorial();
    expect(service.isCompleted()).toBe(true);
    expect(dirtyCalls).toBe(4);

    service.startIfNeeded();
    expect(service.isActive()).toBe(false);
    expect(service.currentStepId()).toBeNull();
    expect(dirtyCalls).toBe(4);
  });

  it('should hydrate defaults when save data is missing and complete when acknowledging the final step', () => {
    service.hydrate(undefined);

    expect(service.isActive()).toBe(false);
    expect(service.currentStepId()).toBeNull();
    expect(service.serialize().seenStepIds).toEqual([]);

    service.hydrate({
      isActive: true,
      isCompleted: false,
      isSkipped: false,
      currentStepId: 'complete',
      seenStepIds: ['welcome'],
      flags: {
        'manual-scrap-generated': false,
        'crusher-activated': false,
        'crusher-cycle-completed': false,
        'metal-sold': false,
        'first-upgrade-purchased': false,
      },
    });

    expect(service.currentStepId()).toBe('complete');

    service.acknowledgeCurrentStep();

    expect(service.isCompleted()).toBe(true);
    expect(service.currentStepId()).toBeNull();
    expect(service.serialize().seenStepIds).toHaveLength(service.steps.length);
    expect(dirtyCalls).toBe(1);
  });

  it('should auto-complete custom resource-threshold steps when their requirement is already satisfied', () => {
    const originalSteps = [...service.steps];

    service.steps.splice(0, service.steps.length, {
      id: 'resource-threshold-only' as never,
      order: 1,
      presentation: 'inline',
      titleKey: 'tutorial.custom.title',
      bodyKey: 'tutorial.custom.body',
      completionRule: {
        kind: 'resource-threshold',
        resourceId: ResourceType.METAL,
        minimumAmount: 3,
      },
    });

    resourcesService.setAmount(ResourceType.METAL, 3);

    service.hydrate({
      isActive: true,
      isCompleted: false,
      isSkipped: false,
      currentStepId: 'resource-threshold-only' as never,
      seenStepIds: [],
      flags: {
        'manual-scrap-generated': false,
        'crusher-activated': false,
        'crusher-cycle-completed': false,
        'metal-sold': false,
        'first-upgrade-purchased': false,
      },
    });

    expect(service.isCompleted()).toBe(true);
    expect(service.isActive()).toBe(false);
    expect(service.currentStepId()).toBeNull();
    expect(service.serialize().seenStepIds).toEqual(['resource-threshold-only' as never]);

    service.steps.splice(0, service.steps.length, ...originalSteps);
  });

  it('should fall back to defaults when hydrating invalid or partial saved state', () => {
    service.hydrate({
      isActive: true,
      isCompleted: false,
      isSkipped: false,
      currentStepId: 'invalid-step' as never,
      seenStepIds: undefined as never,
      flags: undefined as never,
    });

    expect(service.currentStepId()).toBeNull();
    expect(service.currentStep()).toBeNull();
    expect(service.serialize().seenStepIds).toEqual([]);
    expect(service.serialize().flags).toEqual(DEFAULT_TUTORIAL_EVENT_FLAGS);
  });

  it('should expose zero progress when the tutorial has no steps and keep the current step null', () => {
    const originalSteps = [...service.steps];

    service.steps.splice(0, service.steps.length);

    expect(service.progress()).toBe(0);

    service.startIfNeeded();

    expect(service.currentStepId()).toBeNull();
    expect(service.currentStep()).toBeNull();

    service.steps.splice(0, service.steps.length, ...originalSteps);
  });

  it('should complete immediately when a satisfied terminal step is reached during auto-advance', () => {
    const originalSteps = [...service.steps];

    service.steps.splice(0, service.steps.length, {
      id: 'complete',
      order: 1,
      presentation: 'modal',
      titleKey: 'tutorial.custom.title',
      bodyKey: 'tutorial.custom.body',
      completionRule: { kind: 'event', eventId: 'manual-scrap-generated' },
    });

    service.hydrate({
      isActive: true,
      isCompleted: false,
      isSkipped: false,
      currentStepId: 'complete',
      seenStepIds: [],
      flags: {
        ...DEFAULT_TUTORIAL_EVENT_FLAGS,
        'manual-scrap-generated': true,
      },
    });

    expect(service.isCompleted()).toBe(true);
    expect(service.isActive()).toBe(false);
    expect(service.currentStepId()).toBeNull();

    service.steps.splice(0, service.steps.length, ...originalSteps);
  });

  it('should fall back to the first step when advancing without a current step and reject unknown rules', () => {
    const unknownRuleStep = {
      id: 'welcome',
      order: 1,
      presentation: 'modal',
      titleKey: 'tutorial.custom.title',
      bodyKey: 'tutorial.custom.body',
      completionRule: { kind: 'mystery' } as never,
    };

    (service as never as { advanceToNextStep: () => void }).advanceToNextStep();

    expect(service.currentStepId()).toBe('welcome');
    expect(service.serialize().seenStepIds).toEqual([]);
    expect(
      (service as never as { isStepSatisfied: (step: typeof unknownRuleStep) => boolean }).isStepSatisfied(
        unknownRuleStep,
      ),
    ).toBe(false);
  });
});