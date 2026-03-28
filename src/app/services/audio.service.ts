import { Injectable, effect, inject } from '@angular/core';
import { SettingsService } from './settings.service';

type AudioChannel = 'music' | 'sfx';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private settingsService = inject(SettingsService);

  private readonly gameplayMusicSrc = 'assets/audio/ScrapYard_Game_Loop.mp3';
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

  private gameplayMusicTrack: HTMLAudioElement | null = null;
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
    // Async path: ensures AudioContext is resumed before playing
    void this.resumeAudioContextAndRetryGameTracks();
  }

  stopGameMusicLoop(): void {
    this.shouldPlayGameAmbience = false;
    this.stopLoopTrack(this.gameplayMusicTrack);
    this.stopLoopTrack(this.ambienceTrack);
    this.stopLoopTrack(this.machineHumTrack);
    this.stopMechanicalLayerScheduler();
  }

  // Snappy mechanical click with brief resonance
  playUiClick(): void {
    this.playTone(750, 0.04, 0.07, 'square', 'sfx');
    this.playTone(380, 0.05, 0.04, 'square', 'sfx', 0.025);
  }

  // Quick two-tone confirm ping
  playUpgradeStarted(): void {
    this.playTone(440, 0.1, 0.055, 'triangle', 'sfx');
    this.playTone(660, 0.08, 0.055, 'triangle', 'sfx', 0.07);
  }

  // Rewarding ascending triad (C-E-G)
  playUpgradeCompleted(): void {
    this.playTone(523, 0.28, 0.06, 'triangle', 'sfx');
    this.playTone(659, 0.25, 0.065, 'triangle', 'sfx', 0.07);
    this.playTone(784, 0.28, 0.07, 'triangle', 'sfx', 0.14);
  }

  // Triumphant max-level fanfare — extended C-E-G-C-E (5 notes, wider range)
  playMaxLevelReached(): void {
    this.playTone(523, 0.3, 0.07, 'triangle', 'sfx');
    this.playTone(659, 0.28, 0.07, 'triangle', 'sfx', 0.09);
    this.playTone(784, 0.3, 0.08, 'triangle', 'sfx', 0.18);
    this.playTone(1047, 0.38, 0.09, 'triangle', 'sfx', 0.28);
    this.playTone(1319, 0.42, 0.1, 'triangle', 'sfx', 0.4);
  }

  // Celebration fanfare when a new machine is unlocked (C-E-G-C)
  playMachineUnlocked(): void {
    this.playTone(523, 0.32, 0.07, 'triangle', 'sfx');
    this.playTone(659, 0.3, 0.07, 'triangle', 'sfx', 0.09);
    this.playTone(784, 0.28, 0.08, 'triangle', 'sfx', 0.18);
    this.playTone(1047, 0.4, 0.09, 'triangle', 'sfx', 0.28);
  }

  // Industrial thud (lowpass noise) + metallic ring
  playMachineComplete(): void {
    if (!this.canPlayWithCooldown('machine-complete', 800)) {
      return;
    }
    this.playNoiseBurst(0.1, 0.055, 350, 'lowpass', 'sfx');
    this.playTone(440, 0.18, 0.045, 'sawtooth', 'sfx', 0.02);
    this.playTone(660, 0.12, 0.032, 'triangle', 'sfx', 0.05);
  }

  // Ascending cha-ching (3-note coin toss)
  playResourceSold(): void {
    if (!this.canPlayWithCooldown('resource-sold', 200)) {
      return;
    }
    this.playTone(880, 0.13, 0.055, 'triangle', 'sfx');
    this.playTone(1108, 0.11, 0.06, 'triangle', 'sfx', 0.065);
    this.playTone(1320, 0.13, 0.065, 'triangle', 'sfx', 0.13);
  }

  // Metallic clink: bandpass noise burst + resonant ring
  playScrapGenerated(): void {
    this.playNoiseBurst(0.06, 0.07, 2200, 'bandpass', 'sfx');
    this.playTone(1100, 0.14, 0.045, 'triangle', 'sfx', 0.01);
  }

  // Subtle industrial tick (ambient presence, barely audible)
  playProductionTick(): void {
    if (!this.canPlayWithCooldown('production', 400)) {
      return;
    }
    this.playNoiseBurst(0.04, 0.022, 1000, 'bandpass', 'sfx');
  }

  // "Bwomp" — harsh frequency sweep 320Hz → 60Hz, completely distinct from all other sounds
  playError(): void {
    if (!this.canPlayWithCooldown('error', 250)) {
      return;
    }
    this.playSweep(320, 60, 0.28, 0.09, 'sawtooth', 'sfx');
  }

  // Storage full warning — industrial lowpass thud + descending 2-note sawtooth "dunk-wunk"
  playStorageFull(): void {
    if (!this.canPlayWithCooldown('storage-full', 3000)) {
      return;
    }
    this.playNoiseBurst(0.09, 0.055, 280, 'lowpass', 'sfx');
    this.playTone(390, 0.16, 0.055, 'sawtooth', 'sfx', 0.04);
    this.playTone(270, 0.22, 0.048, 'sawtooth', 'sfx', 0.15);
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

    try {
      this.audioContext = new ContextClass();
    } catch (err) {
      console.warn('[AudioService] AudioContext creation failed:', err);
      return;
    }
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

    if (!this.gameplayMusicTrack) {
      this.gameplayMusicTrack = new Audio(this.gameplayMusicSrc);
      this.gameplayMusicTrack.loop = true;
      this.gameplayMusicTrack.preload = 'auto';
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

    this.startLoopTrack(this.gameplayMusicTrack);
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

    if (this.gameplayMusicTrack) {
      this.gameplayMusicTrack.volume = normalizedMusic * 0.7;
    }

    if (this.ambienceTrack) {
      this.ambienceTrack.volume = normalizedMusic * 0.35;
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

  private playSweep(
    startFreq: number,
    endFreq: number,
    durationSeconds: number,
    gainAmount: number,
    type: OscillatorType,
    channel: AudioChannel,
  ): void {
    this.ensureAudioGraph();

    if (!this.audioContext || this.audioContext.state !== 'running') {
      return;
    }

    const channelGain = channel === 'music' ? this.musicGain : this.sfxGain;
    if (!channelGain) {
      return;
    }

    const now = this.audioContext.currentTime;
    const endTime = now + durationSeconds;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFreq, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), endTime);

    gainNode.gain.setValueAtTime(gainAmount, now);
    gainNode.gain.setValueAtTime(gainAmount, now + durationSeconds * 0.6);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gainNode);
    gainNode.connect(channelGain);

    oscillator.start(now);
    oscillator.stop(endTime + 0.01);
  }

  private playNoiseBurst(
    durationSeconds: number,
    gainAmount: number,
    filterFreq: number,
    filterType: BiquadFilterType,
    channel: AudioChannel,
  ): void {
    this.ensureAudioGraph();

    if (!this.audioContext || this.audioContext.state !== 'running') {
      return;
    }

    const channelGain = channel === 'music' ? this.musicGain : this.sfxGain;
    if (!channelGain) {
      return;
    }

    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = Math.ceil(sampleRate * durationSeconds);
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, this.audioContext.currentTime);
    filter.Q.setValueAtTime(1.5, this.audioContext.currentTime);

    const gainNode = this.audioContext.createGain();
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(gainAmount, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(channelGain);

    source.start(now);
    source.stop(now + durationSeconds + 0.01);
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
