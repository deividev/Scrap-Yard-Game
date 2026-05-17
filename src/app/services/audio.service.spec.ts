import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AudioService } from './audio.service';
import { SettingsService } from './settings.service';

class MockSettingsService {
  private musicVolumeSignal = signal(50);
  private sfxVolumeSignal = signal(70);

  readonly musicVolume = this.musicVolumeSignal.asReadonly();
  readonly sfxVolume = this.sfxVolumeSignal.asReadonly();
}

function createAudioParam() {
  return {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

function createRunningAudioContext() {
  return {
    state: 'running',
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn(() => ({
      gain: createAudioParam(),
      connect: vi.fn(),
    })),
    createOscillator: vi.fn(() => ({
      type: 'triangle' as OscillatorType,
      frequency: createAudioParam(),
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBuffer: vi.fn((_channels: number, size: number) => ({
      getChannelData: vi.fn(() => new Float32Array(size)),
    })),
    createBufferSource: vi.fn(() => ({
      buffer: null as unknown,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBiquadFilter: vi.fn(() => ({
      type: 'lowpass' as BiquadFilterType,
      frequency: createAudioParam(),
      Q: createAudioParam(),
      connect: vi.fn(),
    })),
  };
}

type AudioServiceInternals = {
  playNoiseBurst: (...args: unknown[]) => void;
  playTone: (...args: unknown[]) => void;
  playSweep: (...args: unknown[]) => void;
  playRandomMechanicalLayer: () => void;
  isBrowser: () => boolean;
  ensureGameAmbienceTracks: () => void;
  ensureAudioGraph: () => void;
  registerAutoplayUnlock: () => void;
  applyVolumes: (musicVolume: number, sfxVolume: number) => void;
  startMechanicalLayerScheduler: () => void;
  startLoopTrack: (...args: unknown[]) => void;
  stopLoopTrack: (...args: unknown[]) => void;
  resumeAudioContextAndRetryGameTracks: () => Promise<void>;
  gameplayMusicTrack: { pause: () => void; currentTime: number; volume?: number; loop?: boolean; preload?: string } | null;
  ambienceTrack: { pause: () => void; currentTime: number; volume?: number; loop?: boolean; preload?: string } | null;
  machineHumTrack: { pause: () => void; currentTime: number; volume?: number; loop?: boolean; preload?: string } | null;
  musicGain: { gain: { setValueAtTime: (value: number, time: number) => void } } | null;
  sfxGain: { gain: { setValueAtTime: (value: number, time: number) => void } } | null;
  mechanicalLayerIntervalId: number | null;
  shouldPlayGameAmbience: boolean;
  audioContext: ReturnType<typeof createRunningAudioContext> | { state: string; resume: () => Promise<void>; currentTime: number } | null;
};

describe('AudioService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-16T12:00:00.000Z'));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AudioService,
        { provide: SettingsService, useClass: MockSettingsService },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should gate repeated sound effects behind their cooldown windows', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const noiseSpy = vi.spyOn(internals, 'playNoiseBurst').mockImplementation(() => {});
    const toneSpy = vi.spyOn(internals, 'playTone').mockImplementation(() => {});
    const sweepSpy = vi.spyOn(internals, 'playSweep').mockImplementation(() => {});

    service.playMachineComplete();
    service.playMachineComplete();
    expect(noiseSpy).toHaveBeenCalledTimes(1);
    expect(toneSpy).toHaveBeenCalledTimes(2);

    noiseSpy.mockClear();
    toneSpy.mockClear();

    service.playProductionTick();
    service.playProductionTick();
    expect(noiseSpy).toHaveBeenCalledTimes(1);
    expect(toneSpy).not.toHaveBeenCalled();

    sweepSpy.mockClear();

    service.playError();
    service.playError();
    expect(sweepSpy).toHaveBeenCalledTimes(1);

    toneSpy.mockClear();

    service.playContractWarning();
    service.playContractWarning();
    expect(toneSpy).toHaveBeenCalledTimes(4);

    noiseSpy.mockClear();
    toneSpy.mockClear();

    service.playContractNew();
    service.playContractNew();
    expect(noiseSpy).toHaveBeenCalledTimes(1);
    expect(toneSpy).toHaveBeenCalledTimes(2);

    noiseSpy.mockClear();
    toneSpy.mockClear();

    service.playStorageFull();
    service.playStorageFull();
    expect(noiseSpy).toHaveBeenCalledTimes(1);
    expect(toneSpy).toHaveBeenCalledTimes(2);
  });

  it('should start the mechanical scheduler once and only play layers when ambience and random checks allow it', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const playRandomSpy = vi.spyOn(internals, 'playRandomMechanicalLayer').mockImplementation(() => {});

    let intervalCallback: (() => void) | undefined;
    const setIntervalSpy = vi.spyOn(window, 'setInterval').mockImplementation(((handler: TimerHandler) => {
      intervalCallback = handler as () => void;
      return 123;
    }) as typeof window.setInterval);
    const randomSpy = vi.spyOn(Math, 'random');

    internals.startMechanicalLayerScheduler();
    internals.startMechanicalLayerScheduler();

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(intervalCallback).toBeTypeOf('function');

    internals.shouldPlayGameAmbience = false;
    intervalCallback?.();
    expect(playRandomSpy).not.toHaveBeenCalled();

    internals.shouldPlayGameAmbience = true;
    randomSpy.mockReturnValueOnce(0.8).mockReturnValueOnce(0.2);

    intervalCallback?.();
    expect(playRandomSpy).not.toHaveBeenCalled();

    intervalCallback?.();
    expect(playRandomSpy).toHaveBeenCalledTimes(1);
  });

  it('should stop loop tracks and clear the scheduler when gameplay music stops', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const gameplayMusicTrack = { pause: vi.fn(), currentTime: 5 };
    const ambienceTrack = { pause: vi.fn(), currentTime: 4 };
    const machineHumTrack = { pause: vi.fn(), currentTime: 3 };

    internals.gameplayMusicTrack = gameplayMusicTrack;
    internals.ambienceTrack = ambienceTrack;
    internals.machineHumTrack = machineHumTrack;
    internals.mechanicalLayerIntervalId = 77;
    internals.shouldPlayGameAmbience = true;

    service.stopGameMusicLoop();

    expect(gameplayMusicTrack.pause).toHaveBeenCalledTimes(1);
    expect(ambienceTrack.pause).toHaveBeenCalledTimes(1);
    expect(machineHumTrack.pause).toHaveBeenCalledTimes(1);
    expect(gameplayMusicTrack.currentTime).toBe(0);
    expect(ambienceTrack.currentTime).toBe(0);
    expect(machineHumTrack.currentTime).toBe(0);
    expect(clearIntervalSpy).toHaveBeenCalledWith(77);
    expect(internals.mechanicalLayerIntervalId).toBeNull();
    expect(internals.shouldPlayGameAmbience).toBe(false);
  });

  it('should initialize the audio graph and kick off game ambience startup in browser mode', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const ensureAudioGraphSpy = vi.spyOn(internals, 'ensureAudioGraph').mockImplementation(() => {});
    const ensureTracksSpy = vi.spyOn(internals, 'ensureGameAmbienceTracks').mockImplementation(() => {});
    const registerUnlockSpy = vi.spyOn(internals, 'registerAutoplayUnlock').mockImplementation(() => {});
    const resumeSpy = vi
      .spyOn(internals, 'resumeAudioContextAndRetryGameTracks')
      .mockResolvedValue(undefined);

    service.init();
    service.playGameMusicLoop();

    expect(ensureAudioGraphSpy).toHaveBeenCalledTimes(1);
    expect(ensureTracksSpy).toHaveBeenCalledTimes(2);
    expect(registerUnlockSpy).toHaveBeenCalledTimes(1);
    expect(internals.shouldPlayGameAmbience).toBe(true);
    expect(resumeSpy).toHaveBeenCalledTimes(1);
  });

  it('should short-circuit browser-only entry points when the environment is not a browser', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const isBrowserSpy = vi.spyOn(internals, 'isBrowser').mockReturnValue(false);
    const audioFactory = vi.fn();
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const resumeSpy = vi
      .spyOn(internals, 'resumeAudioContextAndRetryGameTracks')
      .mockResolvedValue(undefined);

    vi.stubGlobal('Audio', audioFactory as unknown as typeof Audio);

    service.init();
    service.playGameMusicLoop();
    internals.ensureGameAmbienceTracks();
    internals.registerAutoplayUnlock();
    internals.playRandomMechanicalLayer();

    expect(isBrowserSpy).toHaveBeenCalled();
    expect(audioFactory).not.toHaveBeenCalled();
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    expect(resumeSpy).not.toHaveBeenCalled();
    expect(internals.shouldPlayGameAmbience).toBe(false);
    expect(internals.gameplayMusicTrack).toBeNull();
  });

  it('should resume a suspended context and start loop playback only when ambience is enabled', async () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const resume = vi.fn().mockResolvedValue(undefined);
    const startLoopSpy = vi.spyOn(internals, 'startLoopTrack').mockImplementation(() => {});
    const startSchedulerSpy = vi.spyOn(internals, 'startMechanicalLayerScheduler').mockImplementation(() => {});

    internals.audioContext = {
      state: 'suspended',
      currentTime: 0,
      resume,
    };

    internals.gameplayMusicTrack = { pause: vi.fn(), currentTime: 0 };
    internals.ambienceTrack = { pause: vi.fn(), currentTime: 0 };
    internals.machineHumTrack = { pause: vi.fn(), currentTime: 0 };
    internals.shouldPlayGameAmbience = false;

    await internals.resumeAudioContextAndRetryGameTracks();

    expect(resume).toHaveBeenCalledTimes(1);
    expect(startLoopSpy).not.toHaveBeenCalled();
    expect(startSchedulerSpy).not.toHaveBeenCalled();

    internals.shouldPlayGameAmbience = true;

    await internals.resumeAudioContextAndRetryGameTracks();

    expect(startLoopSpy).toHaveBeenCalledTimes(3);
    expect(startSchedulerSpy).toHaveBeenCalledTimes(1);
  });

  it('should create ambience tracks only once and reuse them on subsequent setup calls', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const audioFactory = vi.fn(function MockAudioElement(this: {
      loop: boolean;
      preload: string;
      volume: number;
      play: ReturnType<typeof vi.fn>;
      pause: ReturnType<typeof vi.fn>;
      currentTime: number;
    }) {
      this.loop = false;
      this.preload = 'none';
      this.volume = 0;
      this.play = vi.fn().mockResolvedValue(undefined);
      this.pause = vi.fn();
      this.currentTime = 0;
    });
    const applyVolumesSpy = vi.spyOn(internals, 'applyVolumes').mockImplementation(() => {});

    vi.stubGlobal('Audio', audioFactory as unknown as typeof Audio);

    internals.ensureGameAmbienceTracks();
    internals.ensureGameAmbienceTracks();

    expect(audioFactory).toHaveBeenCalledTimes(3);
    expect(internals.gameplayMusicTrack?.loop).toBe(true);
    expect(internals.ambienceTrack?.loop).toBe(true);
    expect(internals.machineHumTrack?.loop).toBe(true);
    expect(applyVolumesSpy).toHaveBeenCalledTimes(2);
  });

  it('should apply normalized volume values to gains and loop tracks', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const musicSetValueAtTime = vi.fn();
    const sfxSetValueAtTime = vi.fn();

    internals.audioContext = {
      state: 'running',
      currentTime: 12,
      resume: vi.fn().mockResolvedValue(undefined),
    };
    internals.musicGain = { gain: { setValueAtTime: musicSetValueAtTime } };
    internals.sfxGain = { gain: { setValueAtTime: sfxSetValueAtTime } };
    internals.gameplayMusicTrack = { pause: vi.fn(), currentTime: 0, volume: 0 };
    internals.ambienceTrack = { pause: vi.fn(), currentTime: 0, volume: 0 };
    internals.machineHumTrack = { pause: vi.fn(), currentTime: 0, volume: 0 };

    internals.applyVolumes(80, 25);

    expect(musicSetValueAtTime).toHaveBeenCalledWith(0.8, 12);
    expect(sfxSetValueAtTime).toHaveBeenCalledWith(0.25, 12);
    expect(internals.gameplayMusicTrack?.volume).toBeCloseTo(0.56);
    expect(internals.ambienceTrack?.volume).toBeCloseTo(0.28);
    expect(internals.machineHumTrack?.volume).toBeCloseTo(0.32);
  });

  it('should create the audio graph through the webkit fallback and warn when context creation fails', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const applyVolumesSpy = vi.spyOn(internals, 'applyVolumes').mockImplementation(() => {});
    const masterConnect = vi.fn();
    const musicConnect = vi.fn();
    const sfxConnect = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const gainNodes = [
      { gain: { setValueAtTime: vi.fn() }, connect: masterConnect },
      { gain: { setValueAtTime: vi.fn() }, connect: musicConnect },
      { gain: { setValueAtTime: vi.fn() }, connect: sfxConnect },
    ];
    const webkitAudioContext = vi.fn(function WebkitAudioContextMock(this: {
      currentTime: number;
      destination: { id: string };
      createGain: ReturnType<typeof vi.fn>;
    }) {
      this.currentTime = 4;
      this.destination = { id: 'destination' };
      this.createGain = vi.fn(() => gainNodes.shift());
    });

    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', webkitAudioContext as unknown as typeof AudioContext);

    internals.ensureAudioGraph();

    expect(webkitAudioContext).toHaveBeenCalledTimes(1);
    expect(musicConnect).toHaveBeenCalled();
    expect(sfxConnect).toHaveBeenCalled();
    expect(masterConnect).toHaveBeenCalled();
    expect(applyVolumesSpy).toHaveBeenCalled();

    const failingContext = vi.fn(function FailingAudioContextMock() {
      throw new Error('no audio');
    });

    internals.audioContext = null;
    vi.stubGlobal('AudioContext', failingContext as unknown as typeof AudioContext);
    vi.stubGlobal('webkitAudioContext', undefined);

    internals.ensureAudioGraph();

    expect(warnSpy).toHaveBeenCalledWith('[AudioService] AudioContext creation failed:', expect.any(Error));

    vi.unstubAllGlobals();
  });

  it('should register autoplay unlock listeners and remove them after the first unlock event', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const resumeSpy = vi
      .spyOn(internals, 'resumeAudioContextAndRetryGameTracks')
      .mockResolvedValue(undefined);
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    internals.registerAutoplayUnlock();

    const pointerHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === 'pointerdown',
    )?.[1] as EventListener;

    expect(pointerHandler).toBeTypeOf('function');

    pointerHandler(new Event('pointerdown'));

    expect(resumeSpy).toHaveBeenCalledTimes(1);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', pointerHandler);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', pointerHandler);
  });

  it('should play loop tracks and random mechanical layers without surfacing playback rejections', async () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const track = {
      play: vi.fn().mockRejectedValue(new Error('blocked')),
      pause: vi.fn(),
      currentTime: 0,
    };
    const audioFactory = vi.fn(function MockAudioElement(this: {
      preload: string;
      volume: number;
      play: ReturnType<typeof vi.fn>;
    }) {
      this.preload = 'none';
      this.volume = 0;
      this.play = vi.fn().mockRejectedValue(new Error('blocked'));
    });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.4);

    vi.stubGlobal('Audio', audioFactory as unknown as typeof Audio);

    internals.startLoopTrack(track as never);
    internals.playRandomMechanicalLayer();
    await Promise.resolve();

    expect(track.play).toHaveBeenCalledTimes(1);
    expect(audioFactory).toHaveBeenCalledWith('assets/audio/hydraulic_hiss_01.wav');
    expect(audioFactory.mock.results[0]?.value.preload).toBe('auto');
    expect(audioFactory.mock.results[0]?.value.volume).toBeCloseTo(0.14);
    expect(audioFactory.mock.results[0]?.value.play).toHaveBeenCalledTimes(1);

    internals.startLoopTrack(null as never);
    internals.stopLoopTrack(null as never);
  });

  it('should execute the real playTone body when the audio context is running', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const audioContext = createRunningAudioContext();

    internals.audioContext = audioContext;
    internals.sfxGain = { gain: { setValueAtTime: vi.fn() } };

    internals.playTone(440, 0.1, 0.05, 'triangle', 'sfx');

    const oscillator = audioContext.createOscillator.mock.results[0]?.value;
    const gainNode = audioContext.createGain.mock.results[0]?.value;

    expect(audioContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(audioContext.createGain).toHaveBeenCalledTimes(1);
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0);
    expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, 0);
    expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalled();
    expect(oscillator.start).toHaveBeenCalledWith(0);
    expect(oscillator.stop).toHaveBeenCalledWith(0.11);
  });

  it('should execute the real playNoiseBurst body when the audio context is running', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const audioContext = createRunningAudioContext();

    internals.audioContext = audioContext;
    internals.sfxGain = { gain: { setValueAtTime: vi.fn() } };

    internals.playNoiseBurst(0.1, 0.05, 1200, 'bandpass', 'sfx');

    const source = audioContext.createBufferSource.mock.results[0]?.value;
    const filter = audioContext.createBiquadFilter.mock.results[0]?.value;
    const gainNode = audioContext.createGain.mock.results[0]?.value;

    expect(audioContext.createBuffer).toHaveBeenCalledTimes(1);
    expect(audioContext.createBufferSource).toHaveBeenCalledTimes(1);
    expect(audioContext.createBiquadFilter).toHaveBeenCalledTimes(1);
    expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1200, 0);
    expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(1.5, 0);
    expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 0.1);
    expect(source.start).toHaveBeenCalledWith(0);
    expect(source.stop).toHaveBeenCalledWith(0.11);
  });

  it('should execute the real playSweep body when the audio context is running', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const audioContext = createRunningAudioContext();

    internals.audioContext = audioContext;
    internals.sfxGain = { gain: { setValueAtTime: vi.fn() } };

    internals.playSweep(320, 60, 0.2, 0.09, 'sawtooth', 'sfx');

    const oscillator = audioContext.createOscillator.mock.results[0]?.value;
    const gainNode = audioContext.createGain.mock.results[0]?.value;

    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(320, 0);
    expect(oscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(60, 0.2);
    expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.09, 0);
    expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.0001, 0.2);
    expect(oscillator.start).toHaveBeenCalledWith(0);
    expect(oscillator.stop).toHaveBeenCalledWith(0.21000000000000002);
  });

  it('should short-circuit synthesis helpers when the audio context is missing or suspended', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;

    internals.audioContext = null;
    internals.playTone(440, 0.1, 0.05, 'triangle', 'sfx');
    internals.playNoiseBurst(0.1, 0.05, 1200, 'bandpass', 'sfx');
    internals.playSweep(320, 60, 0.2, 0.09, 'sawtooth', 'sfx');

    internals.audioContext = {
      state: 'suspended',
      currentTime: 0,
      resume: vi.fn().mockResolvedValue(undefined),
    };
    internals.playTone(440, 0.1, 0.05, 'triangle', 'sfx');
    internals.playNoiseBurst(0.1, 0.05, 1200, 'bandpass', 'sfx');
    internals.playSweep(320, 60, 0.2, 0.09, 'sawtooth', 'sfx');
  });

  it('should short-circuit synthesis helpers when the selected channel gain is missing', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const audioContext = createRunningAudioContext();

    internals.audioContext = audioContext;
    internals.musicGain = null;
    internals.sfxGain = null;

    internals.playTone(440, 0.1, 0.05, 'triangle', 'music');
    internals.playNoiseBurst(0.1, 0.05, 1200, 'bandpass', 'music');
    internals.playSweep(320, 60, 0.2, 0.09, 'sawtooth', 'music');

    expect(audioContext.createOscillator).not.toHaveBeenCalled();
    expect(audioContext.createBuffer).not.toHaveBeenCalled();
    expect(audioContext.createBiquadFilter).not.toHaveBeenCalled();
  });

  it('should cover the remaining public sound wrappers through their real routing helpers', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const noiseSpy = vi.spyOn(internals, 'playNoiseBurst').mockImplementation(() => {});
    const toneSpy = vi.spyOn(internals, 'playTone').mockImplementation(() => {});

    service.playUiClick();
    service.playUpgradeStarted();
    service.playUpgradeCompleted();
    service.playMaxLevelReached();
    service.playMachineUnlocked();
    service.playScrapGenerated();
    service.playResourceSold();

    expect(noiseSpy).toHaveBeenCalled();
    expect(toneSpy).toHaveBeenCalled();
    expect(toneSpy.mock.calls.length).toBeGreaterThan(10);
  });

  it('should run the constructor volume effect with the default settings values', () => {
    const applyVolumesSpy = vi.spyOn(
      AudioService.prototype as unknown as { applyVolumes: (musicVolume: number, sfxVolume: number) => void },
      'applyVolumes',
    );

    TestBed.inject(AudioService);
    TestBed.flushEffects();

    expect(applyVolumesSpy).toHaveBeenCalledWith(50, 70);
  });

  it('should re-open the resource-sold cooldown window after 200 milliseconds', () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const toneSpy = vi.spyOn(internals, 'playTone').mockImplementation(() => {});

    service.playResourceSold();
    service.playResourceSold();

    expect(toneSpy).toHaveBeenCalledTimes(3);

    vi.advanceTimersByTime(201);
    service.playResourceSold();

    expect(toneSpy).toHaveBeenCalledTimes(6);
  });

  it('should stop early when resuming the suspended audio context fails', async () => {
    const service = TestBed.inject(AudioService);
    const internals = service as unknown as AudioServiceInternals;
    const startLoopSpy = vi.spyOn(internals, 'startLoopTrack').mockImplementation(() => {});
    const startSchedulerSpy = vi.spyOn(internals, 'startMechanicalLayerScheduler').mockImplementation(() => {});

    internals.audioContext = {
      state: 'suspended',
      currentTime: 0,
      resume: vi.fn().mockRejectedValue(new Error('resume blocked')),
    };
    internals.shouldPlayGameAmbience = true;
    internals.gameplayMusicTrack = { pause: vi.fn(), currentTime: 0 };
    internals.ambienceTrack = { pause: vi.fn(), currentTime: 0 };
    internals.machineHumTrack = { pause: vi.fn(), currentTime: 0 };

    await internals.resumeAudioContextAndRetryGameTracks();

    expect(startLoopSpy).not.toHaveBeenCalled();
    expect(startSchedulerSpy).not.toHaveBeenCalled();
  });
});