import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EventBannerComponent } from './event-banner.component';
import { MarketEventService } from '../../services/market-event.service';
import { TranslationService } from '../../services/translation.service';
import { MarketEvent } from '../../models/market-event.model';
import { ResourceType } from '../../models/resource.model';

class MockMarketEventService {
  private _activeEvent = signal<MarketEvent | null>(null);
  readonly activeEvent = this._activeEvent.asReadonly();

  setEvent(event: MarketEvent | null): void {
    this._activeEvent.set(event);
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }
  tp(_key: string, params: Record<string, string | number>): string {
    // Return param values so tests can assert on them
    return Object.entries(params)
      .map(([k, v]) => `${k}:${v}`)
      .join(' ');
  }
}

const BOOM_EVENT: MarketEvent = {
  type: 'boom_pcs',
  affectedResources: [ResourceType.LAPTOP, ResourceType.DESKTOP_PC],
  priceMultiplier: 3,
  durationSeconds: 120,
  timeRemaining: 87,
};

const CRASH_EVENT: MarketEvent = {
  type: 'market_crash',
  affectedResources: [ResourceType.METAL],
  priceMultiplier: 0.4,
  durationSeconds: 60,
  timeRemaining: 30,
};

const NEGATIVE_EVENT: MarketEvent = {
  type: 'materials_shortage',
  affectedResources: [ResourceType.METAL, ResourceType.PLASTIC],
  priceMultiplier: 0.5,
  durationSeconds: 75,
  timeRemaining: 42,
};

describe('EventBannerComponent', () => {
  let marketEventService: MockMarketEventService;

  beforeEach(async () => {
    marketEventService = new MockMarketEventService();

    await TestBed.configureTestingModule({
      imports: [EventBannerComponent],
      providers: [
        { provide: MarketEventService, useValue: marketEventService },
        { provide: TranslationService, useClass: MockTranslationService },
      ],
    }).compileComponents();
  });

  it('should not render banner when no event is active', () => {
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.event-banner');
    expect(banner).toBeNull();
  });

  it('should render banner when an event is active', () => {
    marketEventService.setEvent(BOOM_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.event-banner');
    expect(banner).not.toBeNull();
  });

  it('should display event name via translation key', () => {
    marketEventService.setEvent(BOOM_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('.event-banner__name');
    expect(name?.textContent?.trim()).toBe('events.name.boom_pcs');
  });

  it('should display affected resources via translation keys', () => {
    marketEventService.setEvent(BOOM_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const resources = fixture.nativeElement.querySelector('.event-banner__resources');
    expect(resources?.textContent?.trim()).toBe('resources.laptop, resources.desktop_pc');
  });

  it('should display a shared all-resources message for market_crash', () => {
    marketEventService.setEvent(CRASH_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const resources = fixture.nativeElement.querySelector('.event-banner__resources');
    expect(resources?.textContent?.trim()).toBe('events.banner.all_resources_affected');
  });

  it('should display the price multiplier', () => {
    marketEventService.setEvent(BOOM_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const multiplier = fixture.nativeElement.querySelector('.event-banner__multiplier');
    expect(multiplier?.textContent?.trim()).toBe('×3');
  });

  it('should show the multiplier in green for positive events', () => {
    marketEventService.setEvent(BOOM_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const multiplier = fixture.nativeElement.querySelector('.event-banner__multiplier');
    expect(multiplier?.classList.contains('event-banner__multiplier--positive')).toBe(true);
    expect(multiplier?.classList.contains('event-banner__multiplier--negative')).toBe(false);
  });

  it('should show the multiplier in red for negative events', () => {
    marketEventService.setEvent(NEGATIVE_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const multiplier = fixture.nativeElement.querySelector('.event-banner__multiplier');
    expect(multiplier?.classList.contains('event-banner__multiplier--negative')).toBe(true);
    expect(multiplier?.classList.contains('event-banner__multiplier--positive')).toBe(false);
  });

  it('should display time remaining via tp', () => {
    marketEventService.setEvent(BOOM_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const time = fixture.nativeElement.querySelector('.event-banner__time');
    // Mock tp returns "time:87" — verifies component passes timeRemaining correctly
    expect(time?.textContent?.trim()).toBe('time:87');
  });

  it('should apply event-type modifier class', () => {
    marketEventService.setEvent(CRASH_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.event-banner--market_crash');
    expect(banner).not.toBeNull();
  });

  it('should hide banner when event becomes null', () => {
    marketEventService.setEvent(BOOM_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.event-banner')).not.toBeNull();

    marketEventService.setEvent(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.event-banner')).toBeNull();
  });

  it('should show 📈 icon for boom_pcs', () => {
    marketEventService.setEvent(BOOM_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('.event-banner__icon');
    expect(icon?.textContent?.trim()).toBe('📈');
  });

  it('should show 📉 icon for market_crash', () => {
    marketEventService.setEvent(CRASH_EVENT);
    const fixture = TestBed.createComponent(EventBannerComponent);
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('.event-banner__icon');
    expect(icon?.textContent?.trim()).toBe('📉');
  });
});
