import { Injectable, signal, computed } from '@angular/core';
import esTranslations from '../../assets/i18n/es.json';
import enTranslations from '../../assets/i18n/en.json';

export type Language = 'en' | 'es';

export interface Translations {
  sections: {
    machines: string;
  };
  resources: {
    scrap: string;
    metal: string;
    plastic: string;
    components: string;
    money: string;
  };
  machines: {
    crusher: string;
    separator: string;
    smelter: string;
    assembler: string;
    packager: string;
  };
  status: {
    ok: string;
    parada: string;
    bloqueada: string;
    falta_input: string;
    output_lleno: string;
  };
  buttons: {
    activa: string;
    parada: string;
    mejorar: string;
    start: string;
    stop: string;
    chatarra: string;
  };
  upgrades: {
    title: string;
    tabs: {
      scrap: string;
      storage: string;
      machine: string;
    };
    nivel: string;
    max_level: string;
    scrap_auto: {
      name: string;
      manual: string;
      automatic: string;
      per_second: string;
      none: string;
    };
    storage: {
      scrap: string;
      metal: string;
      plastic: string;
      components: string;
    };
    capacity_label: string;
    machine_tab: {
      no_selection: string;
      level_label: string;
      base_speed_label: string;
      cycles_per_second: string;
      speed_upgrades_coming: string;
    };
  };
  debug: {
    tick: string;
  };
  common: {
    level_short: string;
    cycle_time: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private currentLanguage = signal<Language>('es');
  private translationsMap: Record<Language, Translations> = {
    es: esTranslations as Translations,
    en: enTranslations as Translations,
  };

  private translations = computed(() => this.translationsMap[this.currentLanguage()]);

  constructor() {
    console.log('TranslationService initialized with language:', this.currentLanguage());
    console.log('Translations loaded:', this.translations());
  }

  setLanguage(lang: Language): void {
    this.currentLanguage.set(lang);
    console.log('Language changed to:', lang);
  }

  getLanguage(): Language {
    return this.currentLanguage();
  }

  t(key: string): string {
    const trans = this.translations();
    if (!trans) {
      console.warn('No translations loaded, returning key:', key);
      return key;
    }

    const keys = key.split('.');
    let value: any = trans;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  // Computed signals for easy access
  resources = computed(() => this.translations()?.resources);
  machines = computed(() => this.translations()?.machines);
  status = computed(() => this.translations()?.status);
  buttons = computed(() => this.translations()?.buttons);
  upgrades = computed(() => this.translations()?.upgrades);
  debug = computed(() => this.translations()?.debug);
}
