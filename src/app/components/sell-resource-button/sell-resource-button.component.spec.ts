import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SellResourceButtonComponent } from './sell-resource-button.component';
import { MarketService } from '../../services/market.service';
import { ResourceType } from '../../models/resource.model';
import { ResourcesService } from '../../services/resources.service';
import { TranslationService } from '../../services/translation.service';
import { AudioService } from '../../services/audio.service';

class MockMarketService {
  private manualSaleAmountSignal = signal(8);
  sellable = true;
  sellReturnValue = true;
  sellCalls: Array<{ resourceId: ResourceType; amount: number }> = [];

  get manualSaleAmount(): number {
    return this.manualSaleAmountSignal();
  }

  set manualSaleAmount(value: number) {
    this.manualSaleAmountSignal.set(value);
  }

  getManualSaleAmount(): number {
    return this.manualSaleAmountSignal();
  }

  getManualSaleValue(_resourceId: ResourceType, amount: number): number {
    return amount * 3;
  }

  getBatchBonusPercent(amount: number): number {
    return amount >= 5 ? 15 : 0;
  }

  isManuallySellable(): boolean {
    return this.sellable;
  }

  sell(resourceId: ResourceType, amount: number): boolean {
    this.sellCalls.push({ resourceId, amount });
    return this.sellReturnValue;
  }
}

class MockResourcesService {
  getAll() {
    return [{ id: ResourceType.METAL, icon: 'metal.png', amount: 8, capacity: 20, name: 'Metal' }];
  }

  getCapacity(): number {
    return 20;
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }

  tp(key: string, params: Record<string, string | number>): string {
    return `${key}:${params['amount'] ?? ''}:${params['money'] ?? ''}:${params['percent'] ?? ''}`;
  }
}

class MockAudioService {
  soldCalls = 0;

  playResourceSold(): void {
    this.soldCalls += 1;
  }
}

describe('SellResourceButtonComponent', () => {
  let marketService: MockMarketService;
  let audioService: MockAudioService;

  beforeEach(() => {
    vi.useFakeTimers();
    marketService = new MockMarketService();
    audioService = new MockAudioService();

    TestBed.configureTestingModule({
      providers: [
        { provide: MarketService, useValue: marketService },
        { provide: ResourcesService, useClass: MockResourcesService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: AudioService, useValue: audioService },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should open the panel, clamp the amount, and close when clicking outside', () => {
    const fixture = TestBed.createComponent(SellResourceButtonComponent);
    fixture.componentRef.setInput('resourceId', ResourceType.METAL);
    vi.spyOn(fixture.nativeElement as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      x: 45,
      y: 60,
      top: 60,
      left: 45,
      right: 120,
      bottom: 100,
      width: 75,
      height: 40,
      toJSON: () => ({}),
    } as DOMRect);
    fixture.detectChanges();

    fixture.componentInstance.togglePanel();
    fixture.componentInstance.setAmount(99);
    fixture.componentInstance.onAmountInput({ target: { value: 'foo' } } as unknown as Event);
    fixture.detectChanges();

    expect(fixture.componentInstance.isPanelOpen()).toBe(true);
    expect(fixture.componentInstance.panelTop()).toBe(106);
    expect(fixture.componentInstance.panelLeft()).toBe(45);
    expect(fixture.componentInstance.saleAmount()).toBe(8);

    fixture.componentInstance.onDocumentClick({ target: document.body } as unknown as Event);
    expect(fixture.componentInstance.isPanelOpen()).toBe(false);
  });

  it('should render bonus information and sell with floating feedback cleanup', () => {
    const fixture = TestBed.createComponent(SellResourceButtonComponent);
    fixture.componentRef.setInput('resourceId', ResourceType.METAL);
    fixture.detectChanges();

    fixture.componentInstance.setAmount(5);
    fixture.componentInstance.isPanelOpen.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('sell.bonus_active');
    expect(fixture.nativeElement.querySelector('.sell-panel-bonus-strip')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sell-action').disabled).toBe(false);

    fixture.componentInstance.sell();
    fixture.detectChanges();

    expect(marketService.sellCalls).toEqual([{ resourceId: ResourceType.METAL, amount: 5 }]);
    expect(audioService.soldCalls).toBe(1);
    expect(fixture.componentInstance.isPanelOpen()).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('.sell-float-text')).toHaveLength(1);

    vi.advanceTimersByTime(701);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.sell-float-text')).toHaveLength(0);
  });

  it('should disable selling controls when no stock is available', () => {
    marketService.manualSaleAmount = 0;
    const fixture = TestBed.createComponent(SellResourceButtonComponent);
    fixture.componentRef.setInput('resourceId', ResourceType.METAL);
    fixture.detectChanges();

    const actionButton = fixture.nativeElement.querySelector('.sell-action') as HTMLButtonElement;
    const toggleButton = fixture.nativeElement.querySelector('.sell-toggle') as HTMLButtonElement;

    expect(actionButton.disabled).toBe(true);
    expect(toggleButton.disabled).toBe(true);
    expect(fixture.componentInstance.hasStock()).toBe(false);
    expect(fixture.componentInstance.canSell()).toBe(false);
  });

  it('should support setMax, step controls, and ignore non-node outside click events', () => {
    const fixture = TestBed.createComponent(SellResourceButtonComponent);
    fixture.componentRef.setInput('resourceId', ResourceType.METAL);
    fixture.detectChanges();

    fixture.componentInstance.setAmount(2);
    fixture.componentInstance.increase();
    fixture.componentInstance.decrease();
    fixture.componentInstance.setMax();
    fixture.componentInstance.isPanelOpen.set(true);
    fixture.componentInstance.onDocumentClick({ target: 123 } as unknown as Event);

    expect(fixture.componentInstance.saleAmount()).toBe(8);
    expect(fixture.componentInstance.isPanelOpen()).toBe(true);
    expect(fixture.componentInstance.canIncrease()).toBe(false);
    expect(fixture.componentInstance.canDecrease()).toBe(true);
  });

  it('should auto-correct invalid internal amounts and close the panel reactively when stock disappears', () => {
    const fixture = TestBed.createComponent(SellResourceButtonComponent);
    fixture.componentRef.setInput('resourceId', ResourceType.METAL);
    fixture.detectChanges();

    (fixture.componentInstance as any).selectedAmount.set(0);
    fixture.componentInstance.isPanelOpen.set(true);
    fixture.detectChanges();

    expect(fixture.componentInstance.saleAmount()).toBe(1);
    expect(fixture.componentInstance.isPanelOpen()).toBe(true);

    marketService.manualSaleAmount = 0;
    fixture.detectChanges();

    expect(fixture.componentInstance.hasStock()).toBe(false);
    expect(fixture.componentInstance.isPanelOpen()).toBe(false);
    expect(fixture.componentInstance.inputMax()).toBe(1);
    expect(fixture.componentInstance.canDecrease()).toBe(false);
  });

  it('should keep the panel open for inside clicks and allow closing it explicitly', () => {
    const fixture = TestBed.createComponent(SellResourceButtonComponent);
    fixture.componentRef.setInput('resourceId', ResourceType.METAL);
    fixture.detectChanges();

    fixture.componentInstance.isPanelOpen.set(true);
    fixture.detectChanges();

    const insideTarget = fixture.nativeElement.querySelector('.sell-action') as HTMLButtonElement;
    fixture.componentInstance.onDocumentClick({ target: insideTarget } as unknown as Event);

    expect(fixture.componentInstance.isPanelOpen()).toBe(true);

    fixture.componentInstance.closePanel();

    expect(fixture.componentInstance.isPanelOpen()).toBe(false);
  });

  it('should not sell when blocked and should keep the panel open if the market rejects the sale', () => {
    marketService.sellable = false;
    const blockedFixture = TestBed.createComponent(SellResourceButtonComponent);
    blockedFixture.componentRef.setInput('resourceId', ResourceType.METAL);
    blockedFixture.detectChanges();

    blockedFixture.componentInstance.sell();
    expect(marketService.sellCalls).toHaveLength(0);

    marketService.sellable = true;
    marketService.sellReturnValue = false;
    const rejectedFixture = TestBed.createComponent(SellResourceButtonComponent);
    rejectedFixture.componentRef.setInput('resourceId', ResourceType.METAL);
    rejectedFixture.detectChanges();

    rejectedFixture.componentInstance.isPanelOpen.set(true);
    rejectedFixture.componentInstance.sell();
    rejectedFixture.detectChanges();

    expect(marketService.sellCalls).toEqual([{ resourceId: ResourceType.METAL, amount: 1 }]);
    expect(audioService.soldCalls).toBe(0);
    expect(rejectedFixture.componentInstance.isPanelOpen()).toBe(true);
    expect(rejectedFixture.nativeElement.querySelectorAll('.sell-float-text')).toHaveLength(0);
  });

  it('should expose computed display values and accept valid numeric input updates', () => {
    const fixture = TestBed.createComponent(SellResourceButtonComponent);
    fixture.componentRef.setInput('resourceId', ResourceType.METAL);
    fixture.detectChanges();

    fixture.componentInstance.setAmount(5);
    fixture.detectChanges();

    expect(fixture.componentInstance.moneyGain()).toBe(15);
    expect(fixture.componentInstance.bonusPercent()).toBe(15);
    expect(fixture.componentInstance.bonusActiveLabel()).toBe('sell.bonus_active:::15');
    expect(fixture.componentInstance.resourceName()).toBe('resources.metal');
    expect(fixture.componentInstance.resourceIcon()).toBe('metal.png');
    expect(fixture.componentInstance.resourceCapacity()).toBe(20);
    expect(fixture.componentInstance.tooltipText()).toBe('tooltips.sell_resource:5:15:');
    expect(fixture.componentInstance.inputMax()).toBe(8);

    fixture.componentInstance.onAmountInput({ target: { value: '3' } } as unknown as Event);

    expect(fixture.componentInstance.saleAmount()).toBe(3);
    expect(fixture.componentInstance.inputAmount()).toBe(3);
  });

  it('should drive the panel controls and preset buttons through the rendered template', () => {
    marketService.manualSaleAmount = 4;

    const fixture = TestBed.createComponent(SellResourceButtonComponent);
    fixture.componentRef.setInput('resourceId', ResourceType.METAL);
    vi.spyOn(fixture.nativeElement as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      x: 10,
      y: 20,
      top: 20,
      left: 10,
      right: 100,
      bottom: 60,
      width: 90,
      height: 40,
      toJSON: () => ({}),
    } as DOMRect);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.sell-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    const stepButtons = Array.from(fixture.nativeElement.querySelectorAll('.sell-step')) as HTMLButtonElement[];
    const presetButtons = Array.from(fixture.nativeElement.querySelectorAll('.sell-preset')) as HTMLButtonElement[];

    expect(fixture.nativeElement.querySelector('.sell-panel-bonus-strip')).toBeNull();
    expect(presetButtons[1].disabled).toBe(true);
    expect(presetButtons[2].disabled).toBe(true);

    stepButtons[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.saleAmount()).toBe(2);

    stepButtons[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.saleAmount()).toBe(1);

    presetButtons[3].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.saleAmount()).toBe(4);

    expect((fixture.nativeElement.querySelector('.sell-toggle') as HTMLButtonElement).getAttribute('aria-expanded')).toBe('true');
  });

  it('should keep the panel position stable when toggling it closed and open again', () => {
    const fixture = TestBed.createComponent(SellResourceButtonComponent);
    fixture.componentRef.setInput('resourceId', ResourceType.METAL);
    vi.spyOn(fixture.nativeElement as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      x: 20,
      y: 35,
      top: 35,
      left: 20,
      right: 110,
      bottom: 75,
      width: 90,
      height: 40,
      toJSON: () => ({}),
    } as DOMRect);
    fixture.detectChanges();

    fixture.componentInstance.togglePanel();
    const firstTop = fixture.componentInstance.panelTop();
    const firstLeft = fixture.componentInstance.panelLeft();

    fixture.componentInstance.togglePanel();
    fixture.componentInstance.togglePanel();

    expect(fixture.componentInstance.isPanelOpen()).toBe(true);
    expect(fixture.componentInstance.panelTop()).toBe(firstTop);
    expect(fixture.componentInstance.panelLeft()).toBe(firstLeft);
  });

  it('should drive the input, preset buttons, and primary sell button through real DOM events', () => {
    marketService.manualSaleAmount = 10;

    const fixture = TestBed.createComponent(SellResourceButtonComponent);
    fixture.componentRef.setInput('resourceId', ResourceType.METAL);
    vi.spyOn(fixture.nativeElement as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      x: 12,
      y: 24,
      top: 24,
      left: 12,
      right: 102,
      bottom: 64,
      width: 90,
      height: 40,
      toJSON: () => ({}),
    } as DOMRect);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.sell-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.sell-input') as HTMLInputElement;
    input.value = '3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.saleAmount()).toBe(3);

    const presetButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.sell-preset'),
    ) as HTMLButtonElement[];

    presetButtons[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.saleAmount()).toBe(1);

    presetButtons[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.saleAmount()).toBe(5);

    presetButtons[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.saleAmount()).toBe(10);

    (fixture.nativeElement.querySelector('.sell-action') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(marketService.sellCalls).toEqual([{ resourceId: ResourceType.METAL, amount: 10 }]);
    expect(audioService.soldCalls).toBe(1);
    expect(fixture.componentInstance.isPanelOpen()).toBe(false);
  });
});