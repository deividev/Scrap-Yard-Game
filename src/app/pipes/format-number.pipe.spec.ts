import { FormatNumberPipe } from './format-number.pipe';

describe('FormatNumberPipe', () => {
  let pipe: FormatNumberPipe;

  beforeEach(() => {
    pipe = new FormatNumberPipe();
  });

  it('should return infinity for nullish and infinite values', () => {
    expect(pipe.transform(null)).toBe('∞');
    expect(pipe.transform(undefined)).toBe('∞');
    expect(pipe.transform(Infinity)).toBe('∞');
  });

  it('should format values in millions without trailing zeros', () => {
    expect(pipe.transform(1500000)).toBe('1.5M');
    expect(pipe.transform(1000000)).toBe('1M');
  });

  it('should format values in thousands without trailing zeros', () => {
    expect(pipe.transform(1250)).toBe('1.25k');
    expect(pipe.transform(1000)).toBe('1k');
  });

  it('should keep smaller values as rounded plain numbers', () => {
    expect(pipe.transform(12.345)).toBe('12.35');
    expect(pipe.transform(999.994)).toBe('999.99');
  });
});