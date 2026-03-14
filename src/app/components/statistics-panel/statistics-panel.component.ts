import { Component, inject, signal } from '@angular/core';
import { StatisticsService } from '../../services/statistics.service';
import { TranslationService } from '../../services/translation.service';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';

@Component({
  selector: 'app-statistics-panel',
  standalone: true,
  imports: [FormatNumberPipe],
  templateUrl: './statistics-panel.component.html',
  styleUrl: './statistics-panel.component.css',
})
export class StatisticsPanelComponent {
  protected statisticsService = inject(StatisticsService);
  protected t = inject(TranslationService);
  protected isCollapsed = signal(false);

  protected toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }
}
