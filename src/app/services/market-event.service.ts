import { Injectable, inject, isDevMode, signal } from '@angular/core';
import { MarketEvent, MarketEventDefinition, MarketEventType } from '../models/market-event.model';
import { ResourceType } from '../models/resource.model';
import { MachineType } from '../models/machine.model';
import { MARKET_EVENTS_CONFIG } from '../config/market-events.config';
import { MarketService } from './market.service';
import { MachinesService } from './machines.service';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';
import { AudioService } from './audio.service';

@Injectable({ providedIn: 'root' })
export class MarketEventService {
  private marketService = inject(MarketService);
  private machinesService = inject(MachinesService);
  private notificationService = inject(NotificationService);
  private translationService = inject(TranslationService);
  private audioService = inject(AudioService);
  private readonly isDev = isDevMode();

  private secondsSinceLastEvent = MARKET_EVENTS_CONFIG.INITIAL_SECONDS_SINCE_LAST_EVENT;

  private readonly _activeEvent = signal<MarketEvent | null>(null);
  readonly activeEvent = this._activeEvent.asReadonly();

  tick(): void {
    const current = this._activeEvent();

    if (current !== null) {
      const newTimeRemaining = current.timeRemaining - 1;
      if (newTimeRemaining <= 0) {
        this.deactivateEvent();
      } else {
        this._activeEvent.set({ ...current, timeRemaining: newTimeRemaining });
      }
      return;
    }

    if (!this.isSmelterUnlocked()) {
      return;
    }

    this.secondsSinceLastEvent++;

    if (this.secondsSinceLastEvent >= MARKET_EVENTS_CONFIG.COOLDOWN_SECONDS) {
      this.trySpawnEvent();
    }
  }

  debugForceRandomEvent(): boolean {
    if (!this.isDev) {
      return false;
    }

    const randomEvent = this.pickRandomEvent(MARKET_EVENTS_CONFIG.EVENTS);
    if (randomEvent === null) {
      return false;
    }

    if (this._activeEvent() !== null) {
      this.clearActiveEvent(false);
    }

    this.activateEvent(randomEvent);
    return true;
  }

  private trySpawnEvent(): void {
    const eligibleEvents = this.getEligibleEvents();
    const randomEvent = this.pickRandomEvent(eligibleEvents);

    if (randomEvent === null) {
      return;
    }

    this.activateEvent(randomEvent);
  }

  private getEligibleEvents(): MarketEventDefinition[] {
    return MARKET_EVENTS_CONFIG.EVENTS.filter((eventDefinition) =>
      this.isEventEligible(eventDefinition),
    );
  }

  private isEventEligible(definition: MarketEventDefinition): boolean {
    return definition.affectedResources.some((resource) => this.isResourceUnlocked(resource));
  }

  private pickRandomEvent(eventDefinitions: readonly MarketEventDefinition[]): MarketEventDefinition | null {
    if (eventDefinitions.length === 0) {
      return null;
    }

    const totalWeight = eventDefinitions.reduce((sum, eventDefinition) => sum + eventDefinition.weight, 0);
    const random = Math.random() * totalWeight;
    let accumulated = 0;

    for (const eventDefinition of eventDefinitions) {
      accumulated += eventDefinition.weight;
      if (random < accumulated) {
        return eventDefinition;
      }
    }

    return eventDefinitions[eventDefinitions.length - 1] ?? null;
  }

  private isSmelterUnlocked(): boolean {
    return this.machinesService
      .getAll()
      .some((machine) => machine.id === MachineType.SMELTER && machine.level > 0);
  }

  private isResourceUnlocked(resourceId: ResourceType): boolean {
    return this.machinesService
      .getAll()
      .some((machine) => machine.level > 0 && machine.baseProduction.resourceId === resourceId);
  }

  private activateEvent(def: MarketEventDefinition): void {
    const event: MarketEvent = {
      type: def.type,
      affectedResources: def.affectedResources,
      priceMultiplier: def.priceMultiplier,
      durationSeconds: def.durationSeconds,
      timeRemaining: def.durationSeconds,
    };

    this._activeEvent.set(event);
    this.secondsSinceLastEvent = 0;

    const multipliers: Partial<Record<ResourceType, number>> = {};
    for (const resource of def.affectedResources) {
      multipliers[resource] = def.priceMultiplier;
    }
    this.marketService.setActiveEventMultipliers(multipliers);
    this.audioService.playMarketEventStart(def.priceMultiplier < 1);

    this.notificationService.show(
      this.translationService.t(`events.type.${def.type}`),
      'info',
    );
  }

  private deactivateEvent(): void {
    this.clearActiveEvent(true);
  }

  private clearActiveEvent(shouldNotify: boolean): void {
    const current = this._activeEvent();
    this._activeEvent.set(null);
    this.secondsSinceLastEvent = 0;
    this.marketService.setActiveEventMultipliers({});

    if (shouldNotify && current !== null) {
      this.notificationService.show(
        this.translationService.t(`events.ended.${current.type}`),
        'info',
      );
    }
  }

  getActiveEventType(): MarketEventType | null {
    return this._activeEvent()?.type ?? null;
  }
}
