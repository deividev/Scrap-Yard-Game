import { TestBed } from '@angular/core/testing';
import { StatisticsService } from './statistics.service';
import { MachinesService } from './machines.service';
import { MachineType } from '../models/machine.model';

class MockMachinesService {
  machines = [
    { id: MachineType.CRUSHER, level: 1, isActive: true },
    { id: MachineType.SEPARATOR, level: 0, isActive: true },
    { id: MachineType.ASSEMBLER, level: 2, isActive: false },
  ];

  getAll(): Array<{ id: MachineType; level: number; isActive: boolean }> {
    return this.machines;
  }
}

describe('StatisticsService', () => {
  let service: StatisticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StatisticsService,
        { provide: MachinesService, useClass: MockMachinesService },
      ],
    });

    service = TestBed.inject(StatisticsService);
  });

  it('should track scrap, money, play time, and active machines', () => {
    service.tick(5);
    service.tick(0);
    service.recordScrapGenerated(7);
    service.recordMoneyEarned(20);

    expect(service.totalScrapGenerated()).toBe(12);
    expect(service.playTimeSeconds()).toBe(2);
    expect(service.totalMoneyEarned()).toBe(20);
    expect(service.activeMachinesCount()).toBe(1);
    expect(service.playTimeFormatted()).toBe('2s');
  });

  it('should format long play times and load or reset state', () => {
    service.loadState({ totalScrapGenerated: 9, playTimeSeconds: 3665, totalMoneyEarned: 40 });

    expect(service.totalScrapGenerated()).toBe(9);
    expect(service.playTimeFormatted()).toBe('1h 1m 5s');
    expect(service.totalMoneyEarned()).toBe(40);

    service.reset();

    expect(service.getState()).toEqual({
      totalScrapGenerated: 0,
      playTimeSeconds: 0,
      totalMoneyEarned: 0,
    });
  });

  it('should format minute-only play times and ignore non-positive manual records', () => {
    service.loadState({ totalScrapGenerated: 0, playTimeSeconds: 65 });

    service.recordScrapGenerated(0);
    service.recordMoneyEarned(0);

    expect(service.playTimeFormatted()).toBe('1m 5s');
    expect(service.totalScrapGenerated()).toBe(0);
    expect(service.totalMoneyEarned()).toBe(0);
  });
});