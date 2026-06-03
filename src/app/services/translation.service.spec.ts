import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslationService],
    });

    service = TestBed.inject(TranslationService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should resolve nested translations and switch languages', () => {
    expect(service.getLanguage()).toBe('es');
    expect(service.t('resources.scrap')).toBe('Chatarra');
    expect(service.resources()?.metal).toBe('Metal');

    service.setLanguage('en');

    expect(service.getLanguage()).toBe('en');
    expect(service.t('resources.scrap')).toBe('Scrap');
    expect(service.machines()?.crusher).toBe('Crusher');
  });

  it('should interpolate parameters on existing translation strings', () => {
    service.setLanguage('en');

    expect(service.tp('tutorial.step_counter', { current: 2, total: 9 })).toBe('Step 2 of 9');
    expect(service.tp('tooltips.generate_scrap', { amount: 5, cost: 1 })).toBe(
      'Generate 5 scrap for 1 money',
    );
  });

  it('should fall back to the key for missing or non-string translation paths', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(service.t('resources')).toBe('resources');
    expect(service.t('missing.translation')).toBe('missing.translation');
    expect(warnSpy).toHaveBeenCalledWith('Translation key not found: missing.translation');
  });
});