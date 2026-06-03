import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ScrapButtonComponent } from './scrap-button.component';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { ResourcesService } from '../../services/resources.service';
import { TranslationService } from '../../services/translation.service';
import { UpgradesService } from '../../services/upgrades.service';
import { AudioService } from '../../services/audio.service';
import { UpgradeId } from '../../models/upgrade.model';
import { ResourceType } from '../../models/resource.model';

class MockScrapGenerationService {
  manualCalls = 0;

  generateManualScrap(): void {
    this.manualCalls += 1;
  }
}

class MockResourcesService {
  hasEnoughResult = true;
  availableSpace = 10;

  hasEnough(resource: ResourceType, amount: number): boolean {
    expect(resource).toBe(ResourceType.MONEY);
    expect(amount).toBeGreaterThan(0);
    return this.hasEnoughResult;
  }

  getAvailableSpace(resource: ResourceType): number {
    expect(resource).toBe(ResourceType.SCRAP);
    return this.availableSpace;
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }

  tp(key: string, params: Record<string, number>): string {
    return `${key}:${params['amount']}:${params['cost']}`;
  }
}

class MockUpgradesService {
  level = 1;

  getLevel(id: UpgradeId): number {
    expect(id).toBe(UpgradeId.UPG_SCRAP_001);
    return this.level;
  }
}

class MockAudioService {
  clicks = 0;

  playUiClick(): void {
    this.clicks += 1;
  }
}

describe('ScrapButtonComponent', () => {
  let resourcesService: MockResourcesService;
  let upgradesService: MockUpgradesService;
  let scrapGenerationService: MockScrapGenerationService;
  let audioService: MockAudioService;

  beforeEach(() => {
    vi.useFakeTimers();
    resourcesService = new MockResourcesService();
    upgradesService = new MockUpgradesService();
    scrapGenerationService = new MockScrapGenerationService();
    audioService = new MockAudioService();

    TestBed.configureTestingModule({
      providers: [
        { provide: ScrapGenerationService, useValue: scrapGenerationService },
        { provide: ResourcesService, useValue: resourcesService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: UpgradesService, useValue: upgradesService },
        { provide: AudioService, useValue: audioService },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should disable the button when money is missing or scrap space is insufficient', () => {
    resourcesService.hasEnoughResult = false;
    const fixture = TestBed.createComponent(ScrapButtonComponent);
    fixture.detectChanges();

    let button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    resourcesService.hasEnoughResult = true;
    resourcesService.availableSpace = 0;
    fixture.detectChanges();

    button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should render boosted tooltip text and generate scrap with floating feedback', () => {
    upgradesService.level = 3;
    resourcesService.availableSpace = 10;
    const fixture = TestBed.createComponent(ScrapButtonComponent);
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.tooltip-wrapper') as HTMLDivElement;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(wrapper.getAttribute('data-tooltip')).toBe(`tooltips.generate_scrap:${fixture.componentInstance.scrapAmount()}:1`);
    expect(button.disabled).toBe(false);

    button.click();
    fixture.detectChanges();

    expect(audioService.clicks).toBe(1);
    expect(scrapGenerationService.manualCalls).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.scrap-float-text')).toHaveLength(1);

    vi.advanceTimersByTime(701);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.scrap-float-text')).toHaveLength(0);
  });
});