import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CRUSHER_CARD_SLOTS, MachineCardSlots } from '../../config/machine-card-slots.config';
import { MachineType } from '../../models/machine.model';
import { MachineCardCalibratorComponent } from './machine-card-calibrator.component';

function cloneSlots(): MachineCardSlots {
  return JSON.parse(JSON.stringify(CRUSHER_CARD_SLOTS)) as MachineCardSlots;
}

function flushPromises(): Promise<void> {
  return Promise.resolve().then(() => Promise.resolve());
}

describe('MachineCardCalibratorComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MachineCardCalibratorComponent],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.querySelectorAll('.cc-panel').forEach((element) => element.remove());
  });

  it('should render handles and load effect fields from the provided slots', () => {
    const fixture = TestBed.createComponent(MachineCardCalibratorComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('slots', cloneSlots());
    fixture.componentRef.setInput('machineId', MachineType.CRUSHER);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const panel = document.body.querySelector('.cc-panel') as HTMLElement;

    expect(host.querySelectorAll('.cc-handle')).toHaveLength(7);
    expect(panel).not.toBeNull();
    expect(panel.textContent).toContain(MachineType.CRUSHER);
    expect(panel.textContent).toContain('Posición / Tamaño');
    expect(panel.textContent).toContain('Partículas');
    expect(component.pType).toBe('steam');
    expect(component.pColorEnabled).toBe(false);
    expect(component.shakeOn).toBe(true);
    expect(component.r4(0.123456)).toBe(0.1235);
    expect(component._isDirty()).toBe(false);
  });

  it('should emit rebuilt slots from field edits and omit default led sizing when not needed', () => {
    const fixture = TestBed.createComponent(MachineCardCalibratorComponent);
    const component = fixture.componentInstance;
    const slots = cloneSlots();

    delete slots.overlay.led.width;
    delete slots.overlay.led.height;

    fixture.componentRef.setInput('slots', slots);
    fixture.componentRef.setInput('machineId', MachineType.CRUSHER);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.slotsChanged, 'emit');

    component.setField('ov.name', 'x', 0.1234);

    const emittedSlots = emitSpy.mock.calls[0]?.[0] as MachineCardSlots;

    expect(component._isDirty()).toBe(true);
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emittedSlots).toMatchObject({
      overlay: {
        name: expect.objectContaining({ left: '12.3%' }),
        led: expect.objectContaining({ top: '32.4%', left: '80.9%' }),
      },
      effects: {
        particles: expect.not.objectContaining({ color: expect.anything() }),
      },
    });
    expect(emittedSlots.overlay.led.width).toBeUndefined();
    expect(emittedSlots.overlay.led.height).toBeUndefined();
  });

  it('should update handles through drag interactions and resize helpers', () => {
    const fixture = TestBed.createComponent(MachineCardCalibratorComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('slots', cloneSlots());
    fixture.detectChanges();

    vi.spyOn((component as unknown as { _el: { nativeElement: HTMLElement } })._el.nativeElement, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 200,
      bottom: 400,
      width: 200,
      height: 400,
      toJSON: () => ({}),
    } as DOMRect);

    const emitSpy = vi.spyOn(component.slotsChanged, 'emit');
    const originalHandle = component._handles().find((handle) => handle.id === 'ov.name');

    component.onMove(new MouseEvent('mousemove'));
    component.onDown(
      {
        clientX: 10,
        clientY: 20,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent,
      'ov.name',
      'body',
    );
    component.onMove({ clientX: 30, clientY: 60 } as MouseEvent);
    component.onUp();

    const movedHandle = component._handles().find((handle) => handle.id === 'ov.name');
    const resizedHandle = (component as unknown as {
      _apply: (
        handle: {
          id: string;
          label: string;
          border: string;
          bg: string;
          x: number;
          y: number;
          w: number;
          h: number;
        },
        corner: 'nw' | 'ne' | 'sw' | 'se' | 'body',
        dx: number,
        dy: number,
      ) => { x: number; y: number; w: number; h: number };
    })._apply(
      {
        id: 'tmp',
        label: 'tmp',
        border: '#fff',
        bg: 'rgba(0,0,0,0)',
        x: 0.2,
        y: 0.3,
        w: 0.02,
        h: 0.02,
      },
      'nw',
      0.05,
      0.05,
    );
    const expandedHandle = (component as unknown as {
      _apply: (
        handle: {
          id: string;
          label: string;
          border: string;
          bg: string;
          x: number;
          y: number;
          w: number;
          h: number;
          keepSquare?: boolean;
        },
        corner: 'nw' | 'ne' | 'sw' | 'se' | 'body',
        dx: number,
        dy: number,
      ) => { x: number; y: number; w: number; h: number };
    })._apply(
      {
        id: 'tmp-se',
        label: 'tmp',
        border: '#fff',
        bg: 'rgba(0,0,0,0)',
        x: 0.2,
        y: 0.3,
        w: 0.1,
        h: 0.1,
      },
      'se',
      0.02,
      0.03,
    );
    const squareHandle = (component as unknown as {
      _apply: (
        handle: {
          id: string;
          label: string;
          border: string;
          bg: string;
          x: number;
          y: number;
          w: number;
          h: number;
          keepSquare?: boolean;
        },
        corner: 'nw' | 'ne' | 'sw' | 'se' | 'body',
        dx: number,
        dy: number,
      ) => { x: number; y: number; w: number; h: number };
    })._apply(
      {
        id: 'tmp-square',
        label: 'tmp',
        border: '#fff',
        bg: 'rgba(0,0,0,0)',
        x: 0.2,
        y: 0.3,
        w: 0.05,
        h: 0.08,
        keepSquare: true,
      },
      'se',
      0.02,
      0.03,
    );

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(movedHandle?.x).toBeCloseTo((originalHandle?.x ?? 0) + 0.1);
    expect(movedHandle?.y).toBeCloseTo((originalHandle?.y ?? 0) + 0.1);
    expect(resizedHandle).toMatchObject({
      x: 0.25,
      y: 0.35,
      w: 0.005,
      h: 0.005,
    });
    expect(expandedHandle.x).toBeCloseTo(0.2);
    expect(expandedHandle.y).toBeCloseTo(0.3);
    expect(expandedHandle.w).toBeCloseTo(0.12);
    expect(expandedHandle.h).toBeCloseTo(0.13);
    expect(squareHandle.w).toBeCloseTo(squareHandle.h);
    expect(squareHandle.w).toBeCloseTo(0.11);
  });

  it('should save emitted slots successfully and clear the dirty state', async () => {
    const fixture = TestBed.createComponent(MachineCardCalibratorComponent);
    const component = fixture.componentInstance;
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: true, constName: 'CRUSHER_CARD_SLOTS' }),
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.stubGlobal('fetch', fetchMock);

    fixture.componentRef.setInput('slots', cloneSlots());
    fixture.componentRef.setInput('machineId', MachineType.CRUSHER);
    fixture.detectChanges();

    component.setField('cv.bar', 'w', 0.5);
    component.saveNow();
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith('/api/calib', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining(`"machineId":"${MachineType.CRUSHER}"`),
    });
    expect(component._isDirty()).toBe(false);
    expect(logSpy).toHaveBeenCalledWith('[calib] ✓ CRUSHER_CARD_SLOTS guardado en disco');
  });

  it('should warn on save errors and rejected save requests', async () => {
    const fixture = TestBed.createComponent(MachineCardCalibratorComponent);
    const component = fixture.componentInstance;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: false, error: 'bad write' }),
      })
      .mockRejectedValueOnce(new Error('offline'));

    vi.stubGlobal('fetch', fetchMock);

    fixture.componentRef.setInput('slots', cloneSlots());
    fixture.detectChanges();

    component.saveNow();
    await flushPromises();
    component.saveNow();
    await flushPromises();

    expect(warnSpy).toHaveBeenCalledWith('[calib] Server error:', 'bad write');
    expect(warnSpy).toHaveBeenCalledWith(
      '[calib] calib-server no disponible — lanza npm run start:calib',
    );
  });

  it('should copy a TypeScript block to the clipboard and remove the teleported panel on destroy', async () => {
    const fixture = TestBed.createComponent(MachineCardCalibratorComponent);
    const component = fixture.componentInstance;
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    fixture.componentRef.setInput('slots', cloneSlots());
    fixture.detectChanges();

    component.pType = 'plasma';
    component.pColorEnabled = true;
    component.pColor = '#123456';
    component.copyTs();
    await flushPromises();

    const copiedText = clipboard.writeText.mock.calls[0][0] as string;
    const panel = document.body.querySelector('.cc-panel');

    expect(copiedText).toContain(`type:         'plasma'`);
    expect(copiedText).toContain(`color:        '#123456'`);
    expect(copiedText).toContain('fullFactor: 1.0');
    expect(logSpy).toHaveBeenCalledWith('[CalibTool] Config copied to clipboard ✓');
    expect(panel).not.toBeNull();

    fixture.destroy();

    expect(document.body.querySelector('.cc-panel')).toBeNull();
  });

  it('should react to direct ngOnChanges updates', () => {
    const fixture = TestBed.createComponent(MachineCardCalibratorComponent);
    const component = fixture.componentInstance;
    const slots = cloneSlots();

    slots.effects.particles.color = '#abcdef';
    component.slots = slots;

    component.ngOnChanges({
      slots: new SimpleChange(null, slots, true),
    });

    expect(component._handles().find((handle) => handle.id === 'pfx.zone')).toBeDefined();
    expect(component.pColorEnabled).toBe(true);
    expect(component.pColor).toBe('#abcdef');
    expect(component.shakeMs).toBe(130);
  });

  it('should restore default effect values when optional particle and shake fields are omitted', () => {
    const fixture = TestBed.createComponent(MachineCardCalibratorComponent);
    const component = fixture.componentInstance;
    const slots = cloneSlots();

    delete slots.effects.particles.maxCount;
    delete slots.effects.particles.spawnRate;
    delete slots.effects.particles.speedScale;
    delete slots.effects.particles.opacityRange;
    delete slots.effects.particles.sizeRange;
    delete slots.effects.particles.color;
    delete slots.effects.shake.intensityPx;
    delete slots.effects.shake.speedMs;

    component.slots = slots;
    component.ngOnChanges({
      slots: new SimpleChange(null, slots, true),
    });

    expect(component.pMax).toBe(12);
    expect(component.pSpawn).toBe(0.1);
    expect(component.pSpeed).toBe(1);
    expect(component.pOpMin).toBe(0.55);
    expect(component.pOpMax).toBe(0.8);
    expect(component.pSzMin).toBe(0.018);
    expect(component.pSzMax).toBe(0.036);
    expect(component.pColorEnabled).toBe(false);
    expect(component.pColor).toBe('#ff9600');
    expect(component.shakeI).toBe(0.35);
    expect(component.shakeMs).toBe(130);
  });

  it('should omit optional ry, led sizing, and particle color when using default circular values', async () => {
    const fixture = TestBed.createComponent(MachineCardCalibratorComponent);
    const component = fixture.componentInstance;
    const slots = cloneSlots();
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    const emitSpy = vi.spyOn(component.slotsChanged, 'emit');

    slots.canvas.led = { cx: 0.5, cy: 0.5, r: 0.05 };
    delete slots.overlay.led.width;
    delete slots.overlay.led.height;
    delete slots.effects.particles.color;

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    fixture.componentRef.setInput('slots', slots);
    fixture.detectChanges();

    component.emit();
    component.copyTs();
    await flushPromises();

    const emittedSlots = emitSpy.mock.calls.at(-1)?.[0] as MachineCardSlots;
    const copiedText = clipboard.writeText.mock.calls.at(-1)?.[0] as string;

    expect(emittedSlots.canvas.led.ry).toBeUndefined();
    expect(emittedSlots.overlay.led.width).toBeUndefined();
    expect(emittedSlots.overlay.led.height).toBeUndefined();
    expect(emittedSlots.effects.particles.color).toBeUndefined();
    expect(copiedText).not.toContain('ry:');
    expect(copiedText).toContain("led:    { top: '32.4%', left: '80.9%' }");
    expect(copiedText).not.toContain('color:');
  });

  it('should drive the template bindings through handle, field, and action interactions', async () => {
    const fixture = TestBed.createComponent(MachineCardCalibratorComponent);
    const component = fixture.componentInstance;
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ok: true, constName: 'CRUSHER_CARD_SLOTS' }),
    });
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    fixture.componentRef.setInput('slots', cloneSlots());
    fixture.componentRef.setInput('machineId', MachineType.CRUSHER);
    fixture.detectChanges();

    vi.spyOn((component as unknown as { _el: { nativeElement: HTMLElement } })._el.nativeElement, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 200,
      bottom: 400,
      width: 200,
      height: 400,
      toJSON: () => ({}),
    } as DOMRect);

    const host = fixture.nativeElement as HTMLElement;
    const panel = document.body.querySelector('.cc-panel') as HTMLElement;
    const handle = host.querySelector('.cc-handle') as HTMLElement;
    const corners = Array.from(host.querySelectorAll('.cc-corner')) as HTMLElement[];
    const select = panel.querySelector('select') as HTMLSelectElement;
    const numberInputs = Array.from(panel.querySelectorAll('input[type="number"]')) as HTMLInputElement[];
    const checkboxes = Array.from(panel.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
    const colorInput = panel.querySelector('input[type="color"]') as HTMLInputElement;
    const saveButton = panel.querySelector('.cc-save-btn') as HTMLButtonElement;
    const copyButton = panel.querySelector('.cc-copy-btn') as HTMLButtonElement;

    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));
    fixture.detectChanges();
    corners.slice(0, 4).forEach((corner, index) => {
      corner.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          clientX: 20 + index,
          clientY: 20 + index,
        }),
      );
    });

    select.value = 'fire';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    numberInputs.slice(0, 10).forEach((input, index) => {
      input.value = `${index + 1}`;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    checkboxes.forEach((checkbox) => checkbox.click());
    fixture.detectChanges();

    colorInput.value = '#654321';
    colorInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(panel.querySelector('.cc-dirty-badge')).not.toBeNull();
    expect(saveButton.disabled).toBe(false);

    saveButton.click();
    copyButton.click();
    await flushPromises();

    expect(component.pType).toBe('fire');
    expect(fetchMock).toHaveBeenCalled();
    expect(clipboard.writeText).toHaveBeenCalled();
  });

  it('should emit updated particle and shake settings from the real panel number inputs', () => {
    const fixture = TestBed.createComponent(MachineCardCalibratorComponent);
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('slots', cloneSlots());
    fixture.componentRef.setInput('machineId', MachineType.CRUSHER);
    fixture.detectChanges();

    const panel = document.body.querySelector('.cc-panel') as HTMLElement;
    const emitSpy = vi.spyOn(component.slotsChanged, 'emit');

    const setNumericField = (labelText: string, value: string) => {
      const label = Array.from(panel.querySelectorAll('label')).find((candidate) =>
        candidate.textContent?.includes(labelText),
      ) as HTMLLabelElement | undefined;
      const input = label?.querySelector('input[type="number"]') as HTMLInputElement | null;

      expect(input, `Missing numeric input for ${labelText}`).not.toBeNull();

      input!.value = value;
      input!.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
    };

    setNumericField('maxCount', '21');
    setNumericField('spawnRate', '0.23');
    setNumericField('speedScale', '1.6');
    setNumericField('opMin', '0.35');
    setNumericField('opMax', '0.92');
    setNumericField('szMin', '0.02');
    setNumericField('szMax', '0.05');
    setNumericField('intensityPx', '0.7');
    setNumericField('speedMs', '180');

    const latestSlots = emitSpy.mock.calls.at(-1)?.[0] as MachineCardSlots;

    expect(latestSlots.effects.particles).toMatchObject({
      maxCount: 21,
      spawnRate: 0.23,
      speedScale: 1.6,
      opacityRange: [0.35, 0.92],
      sizeRange: [0.02, 0.05],
    });
    expect(latestSlots.effects.shake).toMatchObject({
      intensityPx: 0.7,
      speedMs: 180,
    });
    expect(component._isDirty()).toBe(true);
  });
});