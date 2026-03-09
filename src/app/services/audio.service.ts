import { Injectable, effect, inject } from '@angular/core';
import { SettingsService } from './settings.service';

type AudioChannel = 'music' | 'sfx';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private settingsService = inject(SettingsService);

  private readonly ambienceLoopSrc = 'assets/audio/scrapyard_ambience_loop.wav';
  private readonly machineHumLoopSrc = 'assets/audio/machine_hum_loop.wav';
  private readonly mechanicalLayerSrc = [
    'assets/audio/metal_clank_soft_01.wav',
    'assets/audio/hydraulic_hiss_01.wav',
    'assets/audio/conveyor_rattle_01.wav',
  ];

  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private ambienceTrack: HTMLAudioElement | null = null;
  private machineHumTrack: HTMLAudioElement | null = null;
  private mechanicalLayerIntervalId: number | null = null;
  private shouldPlayGameAmbience = false;

  private cooldowns = new Map<string, number>();

  constructor() {
    effect(() => {
      const musicVolume = this.settingsService.musicVolume();
      const sfxVolume = this.settingsService.sfxVolume();
      this.applyVolumes(musicVolume, sfxVolume);
    });
  }

  init(): void {
    if (!this.isBrowser()) {
      return;
    }

    this.ensureAudioGraph();
    this.ensureGameAmbienceTracks();
    this.registerAutoplayUnlock();
  }

  playGameMusicLoop(): void {
    if (!this.isBrowser()) {
      return;
    }

    this.shouldPlayGameAmbience = true;
    this.ensureGameAmbienceTracks();
    this.startLoopTrack(this.ambienceTrack);
    this.startLoopTrack(this.machineHumTrack);
    this.startMechanicalLayerScheduler();
  }

  stopGameMusicLoop(): void {
    this.shouldPlayGameAmbience = false;
    this.stopLoopTrack(this.ambienceTrack);
    this.stopLoopTrack(this.machineHumTrack);
    this.stopMechanicalLayerScheduler();
  }

  playUiClick(): void {
    this.playTone(650, 0.035, 0.3, 'square', 'sfx');
  }

  playUpgradeStarted(): void {
    this.playTone(420, 0.06, 0.35, 'triangle', 'sfx');
    this.playTone(620, 0.05, 0.25, 'triangle', 'sfx', 0.05);
  }

  playUpgradeCompleted(): void {
    this.playTone(520, 0.07, 0.4, 'triangle', 'sfx');
    this.playTone(780, 0.09, 0.35, 'triangle', 'sfx', 0.08);
  }

  playScrapGenerated(): void {
    this.playTone(240, 0.04, 0.22, 'sawtooth', 'sfx');
  }

  playProductionTick(): void {
    if (!this.canPlayWithCooldown('production', 400)) {
      return;
    }
    this.playTone(180, 0.03, 0.2, 'square', 'sfx');
  }

  playError(): void {
    if (!this.canPlayWithCooldown('error', 250)) {
      return;
    }
    this.playTone(160, 0.06, 0.22, 'sawtooth', 'sfx');
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private ensureAudioGraph(): void {
    if (!this.isBrowser() || this.audioContext) {
      return;
    }

    const ContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!ContextClass) {
      return;
    }

    this.audioContext = new ContextClass();
    this.masterGain = this.audioContext.createGain();
    this.musicGain = this.audioContext.createGain();
    this.sfxGain = this.audioContext.createGain();

    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);

    this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
    this.applyVolumes(this.settingsService.musicVolume(), this.settingsService.sfxVolume());
  }

  private ensureGameAmbienceTracks(): void {
    if (!this.isBrowser()) {
      return;
    }

    if (!this.ambienceTrack) {
      this.ambienceTrack = new Audio(this.ambienceLoopSrc);
      this.ambienceTrack.loop = true;
      this.ambienceTrack.preload = 'auto';
    }

    if (!this.machineHumTrack) {
      this.machineHumTrack = new Audio(this.machineHumLoopSrc);
      this.machineHumTrack.loop = true;
      this.machineHumTrack.preload = 'auto';
    }

    this.applyVolumes(this.settingsService.musicVolume(), this.settingsService.sfxVolume());
  }

  private registerAutoplayUnlock(): void {
    if (!this.isBrowser()) {
      return;
    }

    const unlock = () => {
      this.resumeAudioContextAndRetryGameTracks();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  private async resumeAudioContextAndRetryGameTracks(): Promise<void> {
    this.ensureAudioGraph();

    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        return;
      }
    }

    if (!this.shouldPlayGameAmbience) {
      return;
    }

    this.startLoopTrack(this.ambienceTrack);
    this.startLoopTrack(this.machineHumTrack);
    this.startMechanicalLayerScheduler();
  }

  private startLoopTrack(track: HTMLAudioElement | null): void {
    if (!track) {
      return;
    }

    track.play().catch(() => {
      // Autoplay puede bloquear hasta interacción del usuario
    });
  }

  private stopLoopTrack(track: HTMLAudioElement | null): void {
    if (!track) {
      return;
    }

    track.pause();
    track.currentTime = 0;
  }

  private startMechanicalLayerScheduler(): void {
    if (this.mechanicalLayerIntervalId !== null) {
      return;
    }

    this.mechanicalLayerIntervalId = window.setInterval(() => {
      if (!this.shouldPlayGameAmbience) {
        return;
      }

      if (Math.random() < 0.55) {
        this.playRandomMechanicalLayer();
      }
    }, 6000);
  }

  private stopMechanicalLayerScheduler(): void {
    if (this.mechanicalLayerIntervalId !== null) {
      clearInterval(this.mechanicalLayerIntervalId);
      this.mechanicalLayerIntervalId = null;
    }
  }

  private playRandomMechanicalLayer(): void {
    if (!this.isBrowser() || this.mechanicalLayerSrc.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * this.mechanicalLayerSrc.length);
    const src = this.mechanicalLayerSrc[randomIndex];

    const layer = new Audio(src);
    layer.preload = 'auto';
    layer.volume = Math.max(0, Math.min(1, this.settingsService.musicVolume() / 100)) * 0.28;

    layer.play().catch(() => {
      // Ignorar errores de reproducción puntuales
    });
  }

  private applyVolumes(musicVolume: number, sfxVolume: number): void {
    const normalizedMusic = Math.max(0, Math.min(1, musicVolume / 100));
    const normalizedSfx = Math.max(0, Math.min(1, sfxVolume / 100));

    if (this.audioContext && this.musicGain && this.sfxGain) {
      const now = this.audioContext.currentTime;
      this.musicGain.gain.setValueAtTime(normalizedMusic, now);
      this.sfxGain.gain.setValueAtTime(normalizedSfx, now);
    }

    if (this.ambienceTrack) {
      this.ambienceTrack.volume = normalizedMusic * 0.55;
    }

    if (this.machineHumTrack) {
      this.machineHumTrack.volume = normalizedMusic * 0.4;
    }
  }

  private canPlayWithCooldown(key: string, cooldownMs: number): boolean {
    const now = Date.now();
    const last = this.cooldowns.get(key) ?? 0;

    if (now - last < cooldownMs) {
      return false;
    }

    this.cooldowns.set(key, now);
    return true;
  }

  private playTone(
    frequency: number,
    durationSeconds: number,
    gainAmount: number,
    type: OscillatorType,
    channel: AudioChannel,
    delaySeconds = 0,
  ): void {
    this.ensureAudioGraph();

    if (!this.audioContext || this.audioContext.state !== 'running') {
      return;
    }

    const channelGain = channel === 'music' ? this.musicGain : this.sfxGain;
    if (!channelGain) {
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    const startTime = this.audioContext.currentTime + delaySeconds;
    const endTime = startTime + durationSeconds;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainAmount), startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gainNode);
    gainNode.connect(channelGain);

    oscillator.start(startTime);
    oscillator.stop(endTime + 0.01);
  }
}
