import { TestBed } from '@angular/core/testing';
import { UpgradesService } from './upgrades.service';
import { UpgradeProgressService } from './upgrade-progress.service';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';
import { AudioService } from './audio.service';
import { FirstRunTutorialService } from './first-run-tutorial.service';
import { UpgradeId } from '../models/upgrade.model';
import { UPGRADE_DEFINITIONS } from '../config/upgrade-definitions.config';
import { ResourceType } from '../models/resource.model';
import { SCRAP_GENERATION_CONFIG } from '../config/game-balance.config';

class MockUpgradeProgressService {
  inProgress = new Set<UpgradeId>();
  started: Array<{ id: UpgradeId; targetLevel: number; category: 'STORAGE' | 'SCRAP' | 'MACHINE' }> = [];

  isUpgradeInProgress(upgradeId: UpgradeId): boolean {
    return this.inProgress.has(upgradeId);
  }

  startUpgrade(
    upgradeId: UpgradeId,
    targetLevel: number,
    category: 'STORAGE' | 'SCRAP' | 'MACHINE',
  ): void {
    this.started.push({ id: upgradeId, targetLevel, category });
    this.inProgress.add(upgradeId);
  }
}

class MockNotificationService {
  calls: Array<{ message: string; type: string; icon?: string }> = [];

  show(message: string, type: string, icon?: string): void {
    this.calls.push({ message, type, icon });
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }

  tp(key: string, params: Record<string, unknown>): string {
    return `${key}:${JSON.stringify(params)}`;
  }
}

class MockAudioService {
  started = 0;
  completed = 0;

  playUpgradeStarted(): void {
    this.started += 1;
  }

  playUpgradeCompleted(): void {
    this.completed += 1;
  }
}

class MockFirstRunTutorialService {
  events: string[] = [];

  recordEvent(eventId: string): void {
    this.events.push(eventId);
  }
}

class MockStorageUpdater {
  baseCapacities = new Map<ResourceType, number>([
    [ResourceType.SCRAP, 75],
    [ResourceType.METAL, 20],
    [ResourceType.COMPONENTS, 8],
  ]);
  capacities = new Map<ResourceType, number>();

  getBaseCapacity(resourceId: ResourceType): number {
    return this.baseCapacities.get(resourceId) ?? 0;
  }

  setCapacity(resourceId: ResourceType, capacity: number): void {
    this.capacities.set(resourceId, capacity);
  }
}

describe('UpgradesService', () => {
  let service: UpgradesService;
  let progressService: MockUpgradeProgressService;
  let notificationService: MockNotificationService;
  let audioService: MockAudioService;
  let tutorialService: MockFirstRunTutorialService;
  let dirtyCalls: number;

  beforeEach(() => {
    progressService = new MockUpgradeProgressService();
    notificationService = new MockNotificationService();
    audioService = new MockAudioService();
    tutorialService = new MockFirstRunTutorialService();
    dirtyCalls = 0;

    TestBed.configureTestingModule({
      providers: [
        UpgradesService,
        { provide: UpgradeProgressService, useValue: progressService },
        { provide: NotificationService, useValue: notificationService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: AudioService, useValue: audioService },
        { provide: FirstRunTutorialService, useValue: tutorialService },
      ],
    });

    service = TestBed.inject(UpgradesService);
    service.setSaveService({
      markDirty: () => {
        dirtyCalls += 1;
      },
    });
  });

  it('should calculate next-level costs, caps, and component ramps correctly', () => {
    expect(service.getCostForNextLevel(UpgradeId.UPG_STORE_001)).toEqual({ money: 20, components: 0 });
    expect(service.getCostForNextLevel(UpgradeId.UPG_SCRAP_002)).toEqual({ money: 115, components: 0 });
    expect(service.getCostForNextLevel(UpgradeId.UPG_MACH_001)).toEqual({ money: 65, components: 0 });

    service.setState([
      { id: UpgradeId.UPG_STORE_001, level: 50 },
      { id: UpgradeId.UPG_SCRAP_001, level: 3 },
      { id: UpgradeId.UPG_SCRAP_002, level: 15 },
      { id: UpgradeId.UPG_MACH_001, level: 13 },
      { id: UpgradeId.UPG_MACH_002, level: 4 },
      { id: UpgradeId.UPG_MACH_003, level: 50 },
      { id: UpgradeId.UPG_STORE_004, level: 2 },
    ]);

    expect(service.getCostForNextLevel(UpgradeId.UPG_STORE_001)).toBeNull();
    expect(service.getCostForNextLevel(UpgradeId.UPG_SCRAP_001)).toEqual({ money: 174, components: 0 });
    expect(service.getCostForNextLevel(UpgradeId.UPG_SCRAP_002)).toBeNull();
    expect(service.getCostForNextLevel(UpgradeId.UPG_MACH_001)).toMatchObject({ components: 0 });
    expect(service.getCostForNextLevel(UpgradeId.UPG_MACH_002)).toEqual({ money: 171, components: 1 });
    expect(service.getCostForNextLevel(UpgradeId.UPG_MACH_003)).toBeNull();
    expect(service.getCostForNextLevel(UpgradeId.UPG_STORE_004)).toEqual({ money: 42, components: 3 });
  });

  it('should compute storage capacity and apply storage upgrades to resources', () => {
    const storageUpdater = new MockStorageUpdater();

    service.setState([
      { id: UpgradeId.UPG_STORE_001, level: 3 },
      { id: UpgradeId.UPG_STORE_002, level: 2 },
      { id: UpgradeId.UPG_STORE_004, level: 4 },
    ]);

    expect(service.calculateStorageCapacity(UpgradeId.UPG_STORE_001, 3, 75)).toBe(125);
    expect(service.calculateStorageCapacity(UpgradeId.UPG_STORE_004, 4, 8)).toBe(23);

    service.applyStorageUpgrades(storageUpdater);

    expect(storageUpdater.capacities.get(ResourceType.SCRAP)).toBe(125);
    expect(storageUpdater.capacities.get(ResourceType.METAL)).toBe(35);
    expect(storageUpdater.capacities.get(ResourceType.COMPONENTS)).toBe(23);
  });

  it('should purchase upgrades, prevent duplicate in-progress starts, and complete them with side effects', () => {
    service.purchaseUpgrade(UpgradeId.UPG_STORE_001);
    service.purchaseUpgrade(UpgradeId.UPG_STORE_001);

    expect(progressService.started).toEqual([
      { id: UpgradeId.UPG_STORE_001, targetLevel: 2, category: 'STORAGE' },
    ]);
    expect(audioService.started).toBe(1);
    expect(tutorialService.events).toEqual(['first-upgrade-purchased']);
    expect(dirtyCalls).toBe(1);

    progressService.inProgress.delete(UpgradeId.UPG_STORE_001);
    service.completeUpgrade(UpgradeId.UPG_STORE_001);

    expect(service.getLevel(UpgradeId.UPG_STORE_001)).toBe(2);
    expect(audioService.completed).toBe(1);
    expect(notificationService.calls).toHaveLength(1);
    expect(notificationService.calls[0].message).toContain('notifications.upgrade_completed');
    expect(dirtyCalls).toBe(2);
  });

  it('should route purchase categories for storage, scrap, and machine upgrades', () => {
    service.purchaseUpgrade(UpgradeId.UPG_STORE_002);
    service.purchaseUpgrade(UpgradeId.UPG_SCRAP_001);
    service.purchaseUpgrade(UpgradeId.UPG_MACH_002);

    expect(progressService.started).toEqual([
      { id: UpgradeId.UPG_STORE_002, targetLevel: 2, category: 'STORAGE' },
      { id: UpgradeId.UPG_SCRAP_001, targetLevel: 2, category: 'SCRAP' },
      { id: UpgradeId.UPG_MACH_002, targetLevel: 2, category: 'MACHINE' },
    ]);
    expect(audioService.started).toBe(3);
    expect(tutorialService.events).toEqual([
      'first-upgrade-purchased',
      'first-upgrade-purchased',
      'first-upgrade-purchased',
    ]);
    expect(dirtyCalls).toBe(3);
  });

  it('should use category-specific display names in completion notifications', () => {
    service.completeUpgrade(UpgradeId.UPG_STORE_001);
    service.completeUpgrade(UpgradeId.UPG_MACH_001);
    service.completeUpgrade(UpgradeId.UPG_SCRAP_001);
    service.completeUpgrade(UpgradeId.UPG_SCRAP_002);

    expect(notificationService.calls).toHaveLength(4);
    expect(notificationService.calls[0].message).toContain('"name":"upgrades.storage.scrap"');
    expect(notificationService.calls[1].message).toContain(
      '"name":"machines.crusher: upgrades.machine_tab.speed_label"',
    );
    expect(notificationService.calls[2].message).toContain('"name":"upgrades.scrap_manual.name"');
    expect(notificationService.calls[3].message).toContain('"name":"upgrades.scrap_auto.name"');
    expect(audioService.completed).toBe(4);
    expect(dirtyCalls).toBe(4);
  });

  it('should calculate machine speeds, production tiers, and consumption tiers', () => {
    service.setState([
      { id: UpgradeId.UPG_MACH_001, level: 6 },
      { id: UpgradeId.UPG_MACH_003, level: 11 },
      { id: UpgradeId.UPG_MACH_004, level: 41 },
    ]);

    expect(service.getMachineUpgradeIdByMachineType('crusher')).toBe(UpgradeId.UPG_MACH_001);
    expect(service.getMachineUpgradeIdByMachineType('unknown_machine')).toBeNull();
    expect(service.calculateEffectiveSpeed(2, 'crusher')).toBeCloseTo(3);
    expect(service.calculateEffectiveSpeed(2, 'unknown_machine')).toBe(2);
    expect(service.calculateProductionMultiplier('separator')).toBe(2);
    expect(service.calculateProductionMultiplier('assembler')).toBe(5);
    expect(service.calculateConsumptionMultiplier('assembler')).toBe(5);
  });

  it('should return neutral multipliers for unknown machines and known machines below threshold', () => {
    service.setState([
      { id: UpgradeId.UPG_MACH_001, level: 6 },
      { id: UpgradeId.UPG_MACH_002, level: 2 },
    ]);

    expect(service.calculateProductionMultiplier('crusher')).toBe(1);
    expect(service.calculateConsumptionMultiplier('smelter')).toBe(1);
    expect(service.calculateProductionMultiplier('unknown_machine')).toBe(1);
    expect(service.calculateConsumptionMultiplier('unknown_machine')).toBe(1);
  });

  it('should merge saved state with missing upgrades initialized at level one', () => {
    service.setState([
      { id: UpgradeId.UPG_STORE_001, level: 7 },
      { id: UpgradeId.UPG_MACH_001, level: 9 },
    ]);

    expect(service.getAll()).toHaveLength(UPGRADE_DEFINITIONS.length);
    expect(service.getLevel(UpgradeId.UPG_STORE_001)).toBe(7);
    expect(service.getLevel(UpgradeId.UPG_MACH_001)).toBe(9);
    expect(service.getLevel(UpgradeId.UPG_SCRAP_001)).toBe(1);
  });

  it('should return safe defaults for unknown categories and clone state snapshots', () => {
    const snapshot = service.getState();

    expect((service as any).getUpgradeCategory('UPG_UNKNOWN' as UpgradeId)).toBe('MACHINE');
    expect(service.calculateStorageCapacity('UPG_UNKNOWN' as UpgradeId, 4, 123)).toBe(123);

    snapshot[0].level = 99;

    expect(service.getLevel(snapshot[0].id)).toBe(1);
  });

  it('should add scrap auto component costs after the threshold and fall back to definition name keys', () => {
    service.setState([
      { id: UpgradeId.UPG_SCRAP_002, level: SCRAP_GENERATION_CONFIG.COMPONENTS_START_LEVEL },
    ]);

    expect(service.getCostForNextLevel(UpgradeId.UPG_SCRAP_002)?.components).toBe(1);
    expect(
      (service as any).getUpgradeDisplayName({
        id: 'UPG_FAKE' as UpgradeId,
        category: 'MISC',
        nameKey: 'upgrades.fake.name',
      }),
    ).toBe('upgrades.fake.name');
  });
});