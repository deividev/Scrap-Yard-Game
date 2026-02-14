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
    recycled_plastic: string;
    electric_components: string;
  };
  machines: {
    crusher: string;
    separator: string;
    smelter: string;
    assembler: string;
    packager: string;
    electric_packager: string;
    recycler: string;
    electric_assembler: string;
  };
  status: {
    parada: string;
    bloqueada: string;
    falta_input: string;
    output_lleno: string;
    produciendo: string;
  };
  buttons: {
    activa: string;
    parada: string;
    mejorar: string;
    start: string;
    stop: string;
    chatarra: string;
    venderComponentes: string;
  };
  tooltips: {
    generate_scrap: string;
    sell_metal: string;
    sell_components: string;
    machine_speed: string;
    machine_multiplier: string;
  };
  notifications: {
    upgrade_completed: string;
    machine_unlocked: string;
  };
  progression: {
    next_unlock: string;
    all_unlocked: string;
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
    scrap_manual: {
      name: string;
    };
    storage: {
      scrap: string;
      metal: string;
      plastic: string;
      components: string;
      recycled_plastic: string;
      electric_components: string;
    };
    capacity_label: string;
    machine_tab: {
      no_selection: string;
      level_label: string;
      base_speed_label: string;
      effective_speed_label: string;
      efficiency_label: string;
      consumption_label: string;
      production_label: string;
      production_multiplier_label: string;
      next_bonus_label: string;
      in_levels: string;
      cycles_per_second: string;
      speed_upgrades_coming: string;
    };
    scrap_details: {
      manual_label: string;
      automatic_current_label: string;
      next_level_label: string;
      per_click: string;
      per_second: string;
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

  /**
   * Translate with parameters interpolation
   * Usage: tp('tooltips.generate_scrap', { amount: 5, cost: 1 })
   * Returns: "Generar 5 chatarra por 1 dinero"
   */
  tp(key: string, params: Record<string, string | number>): string {
    let translation = this.t(key);
    
    // Replace all {param} with actual values
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, String(params[param]));
    });
    
    return translation;
  }

  // Computed signals for easy access
  resources = computed(() => this.translations()?.resources);
  machines = computed(() => this.translations()?.machines);
  status = computed(() => this.translations()?.status);
  buttons = computed(() => this.translations()?.buttons);
  upgrades = computed(() => this.translations()?.upgrades);
  debug = computed(() => this.translations()?.debug);
}
