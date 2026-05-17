import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UpgradeProgressService } from './upgrade-progress.service';
import { UpgradeId } from '../models/upgrade.model';
import { calculateUpgradeTime } from '../models/upgrade-progress.model';

describe('UpgradeProgressService', () => {
  let service: UpgradeProgressService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-16T15:00:00.000Z'));

    TestBed.configureTestingModule({
      providers: [UpgradeProgressService],
    });

    service = TestBed.inject(UpgradeProgressService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should start upgrades, block duplicates, and expose progress state', () => {
    service.startUpgrade(UpgradeId.UPG_STORE_001, 2, 'STORAGE');
    service.startUpgrade(UpgradeId.UPG_STORE_001, 3, 'STORAGE');

    expect(service.isUpgradeInProgress(UpgradeId.UPG_STORE_001)).toBe(true);
    expect(service.hasActiveUpgrades$()).toBe(true);
    expect(service.activeUpgrades$()).toHaveLength(1);
    expect(service.getUpgradeProgress(UpgradeId.UPG_STORE_001)).toBe(0);
    expect(service.getRemainingTime(UpgradeId.UPG_STORE_001)).toBeCloseTo(
      calculateUpgradeTime(1, 2),
    );
  });

  it('should update progress, complete finished upgrades, and keep others active', () => {
    service.startUpgrade(UpgradeId.UPG_STORE_001, 2, 'STORAGE');
    service.startUpgrade(UpgradeId.UPG_MACH_001, 2, 'MACHINE');

    const completedAfterFirstTick = service.updateProgress(3.5);

    expect(completedAfterFirstTick).toEqual([UpgradeId.UPG_STORE_001]);
    expect(service.isUpgradeInProgress(UpgradeId.UPG_STORE_001)).toBe(false);
    expect(service.isUpgradeInProgress(UpgradeId.UPG_MACH_001)).toBe(true);
    expect(service.getUpgradeProgress(UpgradeId.UPG_MACH_001)).toBeGreaterThan(0);

    const completedAfterSecondTick = service.updateProgress(20);

    expect(completedAfterSecondTick).toEqual([UpgradeId.UPG_MACH_001]);
    expect(service.hasActiveUpgrades$()).toBe(false);
  });

  it('should round-trip serialized state, clamp remaining time, and support reset', () => {
    service.deserialize([
      {
        upgradeId: UpgradeId.UPG_SCRAP_001,
        targetLevel: 4,
        totalTime: 5,
        elapsedTime: 8,
        startTimestamp: Date.now(),
      },
    ]);

    expect(service.serialize()).toHaveLength(1);
    expect(service.getUpgradeProgress(UpgradeId.UPG_SCRAP_001)).toBe(1);
    expect(service.getRemainingTime(UpgradeId.UPG_SCRAP_001)).toBe(0);

    service.cancelUpgrade(UpgradeId.UPG_SCRAP_001);
    expect(service.serialize()).toEqual([]);

    service.startUpgrade(UpgradeId.UPG_SCRAP_002, 2, 'SCRAP');
    expect(service.serialize()).toHaveLength(1);

    service.reset();
    expect(service.serialize()).toEqual([]);
  });

  it('should process offline progress using elapsed time since start timestamp', () => {
    service.deserialize([
      {
        upgradeId: UpgradeId.UPG_STORE_001,
        targetLevel: 2,
        totalTime: 3,
        elapsedTime: 0,
        startTimestamp: Date.now() - 4000,
      },
      {
        upgradeId: UpgradeId.UPG_MACH_001,
        targetLevel: 2,
        totalTime: 20,
        elapsedTime: 0,
        startTimestamp: Date.now() - 5000,
      },
    ]);

    const completed = service.processOfflineProgress(999);

    expect(completed).toEqual([UpgradeId.UPG_STORE_001]);
    expect(service.isUpgradeInProgress(UpgradeId.UPG_MACH_001)).toBe(true);
    expect(service.getRemainingTime(UpgradeId.UPG_MACH_001)).toBeCloseTo(15, 3);
  });

  it('should return zero for unknown upgrades and clear nullish deserialize payloads', () => {
    service.deserialize(undefined as unknown as never[]);

    expect(service.serialize()).toEqual([]);
    expect(service.getUpgradeProgress(UpgradeId.UPG_MACH_002)).toBe(0);
    expect(service.getRemainingTime(UpgradeId.UPG_MACH_002)).toBe(0);
  });
});