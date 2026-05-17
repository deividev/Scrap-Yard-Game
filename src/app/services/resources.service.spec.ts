import { TestBed } from '@angular/core/testing';
import { ResourcesService } from './resources.service';
import { ResourceType } from '../models/resource.model';
import { INITIAL_RESOURCES } from '../config/resources.config';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let dirtyCalls: number;

  beforeEach(() => {
    dirtyCalls = 0;

    TestBed.configureTestingModule({
      providers: [ResourcesService],
    });

    service = TestBed.inject(ResourcesService);
    service.setSaveService({
      markDirty: () => {
        dirtyCalls += 1;
      },
    });
  });

  it('should add resources up to finite capacity and allow unlimited money', () => {
    service.add(ResourceType.METAL, 100);
    service.add(ResourceType.MONEY, 50);
    service.add(ResourceType.METAL, 0);

    expect(service.getAmount(ResourceType.METAL)).toBe(service.getCapacity(ResourceType.METAL));
    expect(service.getAmount(ResourceType.MONEY)).toBe(150);
    expect(dirtyCalls).toBe(2);
  });

  it('should subtract only when enough stock exists', () => {
    const spentMoney = service.subtract(ResourceType.MONEY, 25);
    const overspend = service.subtract(ResourceType.METAL, 1);
    const negativeSpend = service.subtract(ResourceType.MONEY, 0);

    expect(spentMoney).toBe(true);
    expect(overspend).toBe(false);
    expect(negativeSpend).toBe(false);
    expect(service.getAmount(ResourceType.MONEY)).toBe(75);
    expect(dirtyCalls).toBe(1);
  });

  it('should report ratios and space correctly for finite and infinite capacities', () => {
    expect(service.getFillRatio(ResourceType.SCRAP)).toBeCloseTo(30 / 75);
    expect(service.getAvailableSpace(ResourceType.SCRAP)).toBe(45);
    expect(service.isFull(ResourceType.SCRAP)).toBe(false);

    expect(service.getFillRatio(ResourceType.MONEY)).toBe(0);
    expect(service.getAvailableSpace(ResourceType.MONEY)).toBe(Infinity);
    expect(service.isFull(ResourceType.MONEY)).toBe(false);
  });

  it('should preserve configured infinite capacity and icons when loading state', () => {
    service.setState([
      {
        id: ResourceType.SCRAP,
        name: 'Scrap viejo',
        amount: 12,
        capacity: 10,
        icon: 'old-scrap-icon.png',
      },
      {
        id: ResourceType.MONEY,
        name: 'Money viejo',
        amount: 250,
        capacity: 1,
        icon: 'old-money-icon.png',
      },
    ]);

    const money = service.getAll().find((resource) => resource.id === ResourceType.MONEY);
    const scrap = service.getAll().find((resource) => resource.id === ResourceType.SCRAP);
    const metal = service.getAll().find((resource) => resource.id === ResourceType.METAL);
    const configuredMoney = INITIAL_RESOURCES.find((resource) => resource.id === ResourceType.MONEY);
    const configuredScrap = INITIAL_RESOURCES.find((resource) => resource.id === ResourceType.SCRAP);

    expect(money?.capacity).toBe(Infinity);
    expect(money?.icon).toBe(configuredMoney?.icon);
    expect(scrap?.icon).toBe(configuredScrap?.icon);
    expect(metal).toBeDefined();
    expect(service.getAll()).toHaveLength(INITIAL_RESOURCES.length);
  });

  it('should handle custom zero-capacity and missing resources safely', () => {
    service.setState([
      {
        id: 'custom_resource',
        name: 'Custom Resource',
        amount: 0,
        capacity: 0,
        icon: 'custom-resource.png',
      } as (typeof INITIAL_RESOURCES)[number],
    ]);

    const custom = service.getAll().find((resource) => resource.id === 'custom_resource');

    expect(service.getFillRatio('custom_resource')).toBe(1);
    expect(service.getAvailableSpace('missing_resource')).toBe(0);
    expect(service.getBaseCapacity('missing_resource')).toBe(0);
    expect(custom?.icon).toBe('custom-resource.png');
  });

  it('should return safe defaults for unknown resource getters', () => {
    expect(service.getAmount('missing_resource')).toBe(0);
    expect(service.getCapacity('missing_resource')).toBe(Infinity);
    expect(service.isFull('missing_resource')).toBe(false);
    expect(service.getFillRatio('missing_resource')).toBe(0);
  });

  it('should update capacities, report enough stock, and return cloned state snapshots', () => {
    service.setCapacity(ResourceType.SCRAP, 120);
    service.add(ResourceType.SCRAP, 15);

    const snapshot = service.getState();
    snapshot[0].amount = 999;
    snapshot[0].capacity = 999;

    expect(service.getCapacity(ResourceType.SCRAP)).toBe(120);
    expect(service.hasEnough(ResourceType.SCRAP, 40)).toBe(true);
    expect(service.hasEnough(ResourceType.SCRAP, 999)).toBe(false);
    expect(service.getAmount(snapshot[0].id)).not.toBe(999);
    expect(service.getCapacity(snapshot[0].id)).not.toBe(999);
    expect(dirtyCalls).toBe(2);
  });
});