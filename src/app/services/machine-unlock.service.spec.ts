import { TestBed } from '@angular/core/testing';
import { MachineUnlockService } from './machine-unlock.service';
import { MachinesService } from './machines.service';
import { UpgradesService } from './upgrades.service';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';
import { AudioService } from './audio.service';
import { MachineType } from '../models/machine.model';
import { UpgradeId } from '../models/upgrade.model';

class MockMachinesService {
  private machines = new Map<string, { id: string; level: number; icon: string }>();
  unlocked: string[] = [];

  getMachine(machineType: string): { id: string; level: number; icon: string } | undefined {
    return this.machines.get(machineType);
  }

  upgradeLevel(machineType: string): void {
    this.unlocked.push(machineType);
    const machine = this.machines.get(machineType);
    if (machine) {
      machine.level += 1;
    }
  }

  setMachine(machineType: string, level: number, icon = `${machineType}.png`): void {
    this.machines.set(machineType, { id: machineType, level, icon });
  }
}

class MockUpgradesService {
  private levels = new Map<UpgradeId, number>();

  getMachineUpgradeIdByMachineType(machineType: string): UpgradeId | null {
    const mapping: Record<string, UpgradeId> = {
      crusher: UpgradeId.UPG_MACH_001,
      separator: UpgradeId.UPG_MACH_003,
      assembler: UpgradeId.UPG_MACH_004,
      packager: UpgradeId.UPG_MACH_005,
      smelter: UpgradeId.UPG_MACH_002,
    };

    return mapping[machineType] ?? null;
  }

  getLevel(upgradeId: UpgradeId): number {
    return this.levels.get(upgradeId) ?? 1;
  }

  setLevel(upgradeId: UpgradeId, level: number): void {
    this.levels.set(upgradeId, level);
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
  unlocked = 0;

  playMachineUnlocked(): void {
    this.unlocked += 1;
  }
}

describe('MachineUnlockService', () => {
  let service: MachineUnlockService;
  let machinesService: MockMachinesService;
  let upgradesService: MockUpgradesService;
  let notificationService: MockNotificationService;
  let audioService: MockAudioService;

  beforeEach(() => {
    machinesService = new MockMachinesService();
    upgradesService = new MockUpgradesService();
    notificationService = new MockNotificationService();
    audioService = new MockAudioService();

    const allMachines = [
      MachineType.CRUSHER,
      MachineType.SEPARATOR,
      MachineType.ASSEMBLER,
      MachineType.PACKAGER,
      MachineType.SMELTER,
      MachineType.RECYCLER,
      MachineType.ELECTRIC_ASSEMBLER,
      MachineType.ELECTRIC_PACKAGER,
      MachineType.PCB_PRINTER,
      MachineType.HDD_ASSEMBLER,
      MachineType.SCREEN_FABRICATOR,
      MachineType.GPU_FAB,
      MachineType.SMARTPHONE_FACTORY,
      MachineType.LAPTOP_WORKSHOP,
      MachineType.PC_BUILDER,
      MachineType.MINING_RIG_ASSEMBLY,
      MachineType.DATA_CENTER_ASSEMBLY,
    ];

    allMachines.forEach((machineType) => machinesService.setMachine(machineType, 0));
    machinesService.setMachine(MachineType.CRUSHER, 1);

    TestBed.configureTestingModule({
      providers: [
        MachineUnlockService,
        { provide: MachinesService, useValue: machinesService },
        { provide: UpgradesService, useValue: upgradesService },
        { provide: NotificationService, useValue: notificationService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: AudioService, useValue: audioService },
      ],
    });

    service = TestBed.inject(MachineUnlockService);
  });

  it('should report requirements as unmet until referenced machine upgrade levels satisfy them', () => {
    upgradesService.setLevel(UpgradeId.UPG_MACH_001, 5);

    const separatorInfo = service.getUnlockInfo(MachineType.SEPARATOR);
    const assemblerInfo = service.getUnlockInfo(MachineType.ASSEMBLER);

    expect(separatorInfo.isUnlocked).toBe(true);
    expect(separatorInfo.requirements).toEqual([
      {
        machineType: MachineType.CRUSHER,
        requiredLevel: 4,
        currentLevel: 5,
        isMet: true,
      },
    ]);
    expect(assemblerInfo.isUnlocked).toBe(false);
    expect(assemblerInfo.requirements.some((requirement) => requirement.isMet)).toBe(false);
  });

  it('should treat already unlocked machines as unlocked without requirements', () => {
    machinesService.setMachine(MachineType.SEPARATOR, 1);

    expect(service.getUnlockInfo(MachineType.SEPARATOR)).toEqual({
      isUnlocked: true,
      requirements: [],
    });
  });

  it('should unlock separator and assembler when their conditions are met', () => {
    upgradesService.setLevel(UpgradeId.UPG_MACH_001, 6);
    upgradesService.setLevel(UpgradeId.UPG_MACH_003, 4);

    service.checkAndUnlockMachines();

    expect(machinesService.unlocked).toContain(MachineType.SEPARATOR);
    expect(machinesService.unlocked).toContain(MachineType.ASSEMBLER);
    expect(notificationService.calls).toHaveLength(2);
    expect(audioService.unlocked).toBe(2);
  });

  it('should unlock packager and emit the extra upgrade unlocked notification', () => {
    upgradesService.setLevel(UpgradeId.UPG_MACH_001, 8);
    upgradesService.setLevel(UpgradeId.UPG_MACH_004, 3);

    service.checkAndUnlockMachines();

    expect(machinesService.unlocked).toContain(MachineType.SEPARATOR);
    expect(machinesService.unlocked).toContain(MachineType.PACKAGER);
    expect(notificationService.calls).toHaveLength(3);
    expect(
      notificationService.calls.filter((call) => call.message.includes('notifications.machine_unlocked')),
    ).toHaveLength(2);
    expect(
      notificationService.calls.filter((call) => call.message.includes('notifications.upgrade_unlocked')),
    ).toHaveLength(1);
    expect(audioService.unlocked).toBe(2);
  });

  it('should report late-game unlock chains from mixed upgrade and machine levels', () => {
    upgradesService.setLevel(UpgradeId.UPG_MACH_005, 8);
    upgradesService.setLevel(UpgradeId.UPG_MACH_002, 3);

    machinesService.setMachine(MachineType.RECYCLER, 3);
    machinesService.setMachine(MachineType.ELECTRIC_ASSEMBLER, 4);
    machinesService.setMachine(MachineType.PCB_PRINTER, 5);
    machinesService.setMachine(MachineType.HDD_ASSEMBLER, 4);
    machinesService.setMachine(MachineType.SCREEN_FABRICATOR, 3);
    machinesService.setMachine(MachineType.GPU_FAB, 3);
    machinesService.setMachine(MachineType.PC_BUILDER, 2);

    expect(service.getUnlockInfo(MachineType.SMELTER).isUnlocked).toBe(true);
    expect(service.getUnlockInfo(MachineType.RECYCLER).isUnlocked).toBe(true);
    expect(service.getUnlockInfo(MachineType.ELECTRIC_ASSEMBLER).isUnlocked).toBe(true);
    expect(service.getUnlockInfo(MachineType.ELECTRIC_PACKAGER)).toEqual({
      isUnlocked: false,
      requirements: [
        {
          machineType: MachineType.ELECTRIC_ASSEMBLER,
          requiredLevel: 5,
          currentLevel: 4,
          isMet: false,
        },
        {
          machineType: MachineType.PACKAGER,
          requiredLevel: 8,
          currentLevel: 8,
          isMet: true,
        },
      ],
    });
    expect(service.getUnlockInfo(MachineType.PCB_PRINTER).isUnlocked).toBe(true);
    expect(service.getUnlockInfo(MachineType.HDD_ASSEMBLER).isUnlocked).toBe(true);
    expect(service.getUnlockInfo(MachineType.SCREEN_FABRICATOR).isUnlocked).toBe(true);
    expect(service.getUnlockInfo(MachineType.GPU_FAB).isUnlocked).toBe(true);
    expect(service.getUnlockInfo(MachineType.SMARTPHONE_FACTORY).isUnlocked).toBe(true);
    expect(service.getUnlockInfo(MachineType.LAPTOP_WORKSHOP).isUnlocked).toBe(true);
    expect(service.getUnlockInfo(MachineType.PC_BUILDER).isUnlocked).toBe(true);
    expect(service.getUnlockInfo(MachineType.MINING_RIG_ASSEMBLY).isUnlocked).toBe(true);
    expect(service.getUnlockInfo(MachineType.DATA_CENTER_ASSEMBLY)).toEqual({
      isUnlocked: false,
      requirements: [
        {
          machineType: MachineType.PC_BUILDER,
          requiredLevel: 3,
          currentLevel: 2,
          isMet: false,
        },
      ],
    });
  });

  it('should leave unknown machine types locked with no requirements', () => {
    machinesService.setMachine('mystery-machine' as MachineType, 0, 'mystery-machine.png');

    expect(service.getUnlockInfo('mystery-machine' as MachineType)).toEqual({
      isUnlocked: false,
      requirements: [],
    });
  });
});