import { ResourceType } from './resource.model';

export type TutorialStepId =
  | 'welcome'
  | 'generate-scrap'
  | 'activate-crusher'
  | 'watch-crusher-progress'
  | 'collect-metal'
  | 'sell-metal'
  | 'buy-first-upgrade'
  | 'check-next-goal'
  | 'complete';

export type TutorialEventId =
  | 'manual-scrap-generated'
  | 'crusher-activated'
  | 'crusher-cycle-completed'
  | 'metal-sold'
  | 'first-upgrade-purchased';

export type TutorialPresentation = 'modal' | 'spotlight' | 'inline';

export type TutorialCompletionRule =
  | { kind: 'manual' }
  | { kind: 'event'; eventId: TutorialEventId }
  | { kind: 'resource-threshold'; resourceId: ResourceType; minimumAmount: number };

export interface TutorialStep {
  id: TutorialStepId;
  order: number;
  presentation: TutorialPresentation;
  titleKey: string;
  bodyKey: string;
  confirmKey?: string;
  targetId?: string;
  allowManualAdvance?: boolean;
  completionRule: TutorialCompletionRule;
}

export type TutorialEventFlags = Record<TutorialEventId, boolean>;

export interface FirstRunTutorialState {
  isActive: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  currentStepId: TutorialStepId | null;
  seenStepIds: TutorialStepId[];
  flags: TutorialEventFlags;
}

export const DEFAULT_TUTORIAL_EVENT_FLAGS: TutorialEventFlags = {
  'manual-scrap-generated': false,
  'crusher-activated': false,
  'crusher-cycle-completed': false,
  'metal-sold': false,
  'first-upgrade-purchased': false,
};

export function createDefaultFirstRunTutorialState(): FirstRunTutorialState {
  return {
    isActive: false,
    isCompleted: false,
    isSkipped: false,
    currentStepId: null,
    seenStepIds: [],
    flags: { ...DEFAULT_TUTORIAL_EVENT_FLAGS },
  };
}