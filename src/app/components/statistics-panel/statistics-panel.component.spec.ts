import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { StatisticsPanelComponent } from './statistics-panel.component';
import { StatisticsService } from '../../services/statistics.service';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { TranslationService } from '../../services/translation.service';

class MockStatisticsService {
  totalScrapGenerated = signal(10).asReadonly();
  playTimeFormatted = signal('10s').asReadonly();
  activeMachinesCount = signal(1).asReadonly();
  totalMoneyEarned = signal(25).asReadonly();

  setValues(scrap: number, time: string, machines: number, money: number): void {
    (this.totalScrapGenerated as any).set(scrap);
    (this.playTimeFormatted as any).set(time);
    (this.activeMachinesCount as any).set(machines);
    (this.totalMoneyEarned as any).set(money);
  }
}

class MockScrapGenerationService {
  getAutomaticGenerationRate(): number {
    return 4;
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }
}

describe('StatisticsPanelComponent', () => {
  let statisticsService: any;

  beforeEach(() => {
    vi.useFakeTimers();
    const scrapSignal = signal(10);
    const timeSignal = signal('10s');
    const machinesSignal = signal(1);
    const moneySignal = signal(25);
    statisticsService = {
      totalScrapGenerated: scrapSignal.asReadonly(),
      playTimeFormatted: timeSignal.asReadonly(),
      activeMachinesCount: machinesSignal.asReadonly(),
      totalMoneyEarned: moneySignal.asReadonly(),
      setValues: (scrap: number, time: string, machines: number, money: number) => {
        scrapSignal.set(scrap);
        timeSignal.set(time);
        machinesSignal.set(machines);
        moneySignal.set(money);
      },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: StatisticsService, useValue: statisticsService },
        { provide: ScrapGenerationService, useClass: MockScrapGenerationService },
        { provide: TranslationService, useClass: MockTranslationService },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render statistics and toggle collapse state', async () => {
    const fixture = TestBed.createComponent(StatisticsPanelComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('statistics.title');
    expect(fixture.nativeElement.textContent).toContain('4/s');

    (fixture.nativeElement.querySelector('.statistics-header') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect((fixture.componentInstance as any).isCollapsed()).toBe(true);
    expect(fixture.nativeElement.querySelector('.statistics-panel').classList.contains('collapsed')).toBe(true);
  });

  it('should flash changed stats and clear the flash after the timer', async () => {
    const fixture = TestBed.createComponent(StatisticsPanelComponent);
    fixture.detectChanges();

    statisticsService.setValues(20, '20s', 2, 30);
    TestBed.flushEffects();
    fixture.detectChanges();

    const flashingValues = Array.from(fixture.nativeElement.querySelectorAll('.stat-value.flashing'));
    expect(flashingValues.length).toBeGreaterThan(0);

    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.stat-value.flashing')).toHaveLength(0);
  });
});