import { Component, OnDestroy, inject, signal, effect, computed } from '@angular/core';
import { StatisticsService } from '../../services/statistics.service';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { TranslationService } from '../../services/translation.service';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';

@Component({
  selector: 'app-statistics-panel',
  standalone: true,
  imports: [FormatNumberPipe],
  templateUrl: './statistics-panel.component.html',
  styleUrl: './statistics-panel.component.css',
})
export class StatisticsPanelComponent implements OnDestroy {
  protected statisticsService = inject(StatisticsService);
  protected scrapGenerationService = inject(ScrapGenerationService);
  protected t = inject(TranslationService);
  protected isCollapsed = signal(false);
  protected flashingStats = signal<Set<string>>(new Set());
  protected scrapAutoRate = computed(() =>
    this.scrapGenerationService.getAutomaticGenerationRate(),
  );

  private flashTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private prevScrap: number | undefined = undefined;
  private prevTime: string | undefined = undefined;
  private prevMachines: number | undefined = undefined;
  private prevMoney: number | undefined = undefined;

  constructor() {
    effect(() => {
      const scrap = this.statisticsService.totalScrapGenerated();
      const time = this.statisticsService.playTimeFormatted();
      const machines = this.statisticsService.activeMachinesCount();
      const money = this.statisticsService.totalMoneyEarned();

      if (this.prevScrap !== undefined && scrap !== this.prevScrap) this.triggerFlash('scrap');
      if (this.prevTime !== undefined && time !== this.prevTime) this.triggerFlash('time');
      if (this.prevMachines !== undefined && machines !== this.prevMachines)
        this.triggerFlash('machines');
      if (this.prevMoney !== undefined && money !== this.prevMoney) this.triggerFlash('money');

      this.prevScrap = scrap;
      this.prevTime = time;
      this.prevMachines = machines;
      this.prevMoney = money;
    });
  }

  ngOnDestroy(): void {
    this.flashTimers.forEach((t) => clearTimeout(t));
    this.flashTimers.clear();
  }

  private triggerFlash(key: string): void {
    const prev = this.flashTimers.get(key);
    if (prev) clearTimeout(prev);
    this.flashingStats.update((s) => {
      const n = new Set(s);
      n.add(key);
      return n;
    });
    const t = setTimeout(() => {
      this.flashingStats.update((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
      this.flashTimers.delete(key);
    }, 280);
    this.flashTimers.set(key, t);
  }

  protected toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }
}
