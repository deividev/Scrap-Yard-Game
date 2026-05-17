import { TestBed } from '@angular/core/testing';
import { ProgressionHintComponent } from './progression-hint.component';
import { MachinesService } from '../../services/machines.service';
import { MachineUnlockService } from '../../services/machine-unlock.service';
import { TranslationService } from '../../services/translation.service';
import { MachineType } from '../../models/machine.model';

class MockMachinesService {
  getAll(): never[] {
    return [];
  }
}

class MockMachineUnlockService {
  unlockInfo = {
    isUnlocked: false,
    requirements: [
      {
        machineType: MachineType.CRUSHER,
        requiredLevel: 4,
        currentLevel: 2,
        isMet: false,
      },
    ],
  };

  getUnlockInfo(machineType: MachineType) {
    if (machineType === MachineType.SEPARATOR) {
      return this.unlockInfo;
    }

    return { isUnlocked: true, requirements: [] };
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }
}

describe('ProgressionHintComponent', () => {
  let unlockService: MockMachineUnlockService;

  beforeEach(() => {
    unlockService = new MockMachineUnlockService();

    TestBed.configureTestingModule({
      providers: [
        { provide: MachinesService, useClass: MockMachinesService },
        { provide: MachineUnlockService, useValue: unlockService },
        { provide: TranslationService, useClass: MockTranslationService },
      ],
    });
  });

  it('should render the next unlock and its unmet requirements', async () => {
    const fixture = TestBed.createComponent(ProgressionHintComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('progression.next_unlock_label');
    expect(fixture.nativeElement.textContent).toContain('machines.separator');
    expect(fixture.nativeElement.textContent).toContain('machines.crusher');
    expect(fixture.nativeElement.querySelector('.hint-req-icon--unmet')).not.toBeNull();
  });

  it('should hide when all progression targets are already unlocked', async () => {
    unlockService.unlockInfo = { isUnlocked: true, requirements: [] };
    const fixture = TestBed.createComponent(ProgressionHintComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.progression-hint')).toBeNull();
  });
});