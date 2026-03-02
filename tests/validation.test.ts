import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeNumber,
  validateFoodDescription,
  validateQuantity,
  validateBarcode,
  validateWeight,
  validateHeight,
  validateAge,
  validateCalorieTarget,
  validateMacroPercentages,
  sanitizeObject,
} from '../src/utils/validation';

// ─── sanitizeString ──────────────────────────────────────────────────

describe('sanitizeString', () => {
  it('returns empty string for non-string input', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
    expect(sanitizeString(123)).toBe('');
    expect(sanitizeString({})).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('truncates to maxLength', () => {
    expect(sanitizeString('abcdef', 3)).toBe('abc');
  });

  it('strips HTML tags', () => {
    expect(sanitizeString('hello <script>alert(1)</script> world')).toBe('hello alert(1) world');
  });

  it('strips dangerous characters', () => {
    expect(sanitizeString("it's a test")).toBe('its a test');
    expect(sanitizeString('test"value')).toBe('testvalue');
    expect(sanitizeString('test;value')).toBe('testvalue');
  });

  it('uses default maxLength of 200', () => {
    const long = 'a'.repeat(250);
    expect(sanitizeString(long).length).toBe(200);
  });

  it('preserves normal text', () => {
    expect(sanitizeString('Chicken breast 100g')).toBe('Chicken breast 100g');
  });
});

// ─── sanitizeNumber ──────────────────────────────────────────────────

describe('sanitizeNumber', () => {
  it('parses numeric strings', () => {
    expect(sanitizeNumber('42')).toBe(42);
    expect(sanitizeNumber('3.14')).toBeCloseTo(3.14);
  });

  it('returns defaultValue for NaN', () => {
    expect(sanitizeNumber('abc')).toBe(0);
    expect(sanitizeNumber('abc', { defaultValue: 10 })).toBe(10);
  });

  it('returns defaultValue for null/undefined', () => {
    expect(sanitizeNumber(null)).toBe(0);
    expect(sanitizeNumber(undefined)).toBe(0);
  });

  it('clamps to min', () => {
    expect(sanitizeNumber(-5, { min: 0 })).toBe(0);
  });

  it('clamps to max', () => {
    expect(sanitizeNumber(999, { max: 100 })).toBe(100);
  });

  it('passes through valid numbers', () => {
    expect(sanitizeNumber(50, { min: 0, max: 100 })).toBe(50);
  });

  it('handles Infinity as NaN', () => {
    expect(sanitizeNumber(Infinity)).toBe(0);
    expect(sanitizeNumber(-Infinity)).toBe(0);
  });
});

// ─── validateFoodDescription ─────────────────────────────────────────

describe('validateFoodDescription', () => {
  it('rejects empty input', () => {
    const result = validateFoodDescription('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects too-short descriptions', () => {
    const result = validateFoodDescription('X');
    expect(result.valid).toBe(false);
  });

  it('accepts valid food descriptions', () => {
    const result = validateFoodDescription('Grilled chicken breast 150g');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('Grilled chicken breast 150g');
  });

  it('sanitizes HTML in descriptions', () => {
    const result = validateFoodDescription('<b>Chicken</b> breast');
    expect(result.valid).toBe(true);
    expect(result.value).not.toContain('<b>');
  });
});

// ─── validateQuantity ────────────────────────────────────────────────

describe('validateQuantity', () => {
  it('accepts valid quantities', () => {
    const result = validateQuantity(2.5);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(2.5);
  });

  it('clamps zero to min (0.01) and accepts', () => {
    const result = validateQuantity(0);
    expect(result.valid).toBe(true);
    expect(result.value).toBeCloseTo(0.01);
  });

  it('clamps negative to min (0.01) and accepts', () => {
    const result = validateQuantity(-1);
    expect(result.valid).toBe(true);
    expect(result.value).toBeCloseTo(0.01);
  });

  it('accepts string numbers', () => {
    const result = validateQuantity('3');
    expect(result.valid).toBe(true);
    expect(result.value).toBe(3);
  });

  it('rejects non-numeric strings', () => {
    const result = validateQuantity('abc');
    expect(result.valid).toBe(false);
  });
});

// ─── validateBarcode ─────────────────────────────────────────────────

describe('validateBarcode', () => {
  it('accepts valid UPC-A (12 digits)', () => {
    const result = validateBarcode('012345678901');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('012345678901');
  });

  it('accepts valid EAN-13 (13 digits)', () => {
    const result = validateBarcode('5901234123457');
    expect(result.valid).toBe(true);
  });

  it('strips non-digit characters', () => {
    const result = validateBarcode('012-3456-78901');
    expect(result.valid).toBe(true);
    expect(result.value).toBe('012345678901');
  });

  it('rejects too-short barcodes', () => {
    const result = validateBarcode('1234');
    expect(result.valid).toBe(false);
  });

  it('rejects too-long barcodes', () => {
    const result = validateBarcode('123456789012345');
    expect(result.valid).toBe(false);
  });

  it('rejects non-string input', () => {
    const result = validateBarcode(12345678);
    expect(result.valid).toBe(false);
  });
});

// ─── validateWeight ──────────────────────────────────────────────────

describe('validateWeight', () => {
  it('accepts valid weight', () => {
    const result = validateWeight(180);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(180);
  });

  it('clamps too-light weight to min (50)', () => {
    const result = validateWeight(30);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(50);
  });

  it('clamps too-heavy weight to max (700)', () => {
    const result = validateWeight(800);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(700);
  });

  it('accepts boundary values', () => {
    expect(validateWeight(50).valid).toBe(true);
    expect(validateWeight(700).valid).toBe(true);
  });
});

// ─── validateHeight ──────────────────────────────────────────────────

describe('validateHeight', () => {
  it('accepts valid height', () => {
    const result = validateHeight(5, 10);
    expect(result.valid).toBe(true);
    expect(result.value).toEqual({ feet: 5, inches: 10 });
  });

  it('clamps too-short height to min (3 ft)', () => {
    const result = validateHeight(2, 0);
    expect(result.valid).toBe(true);
    expect(result.value!.feet).toBe(3);
  });

  it('clamps too-tall height to max (8 ft)', () => {
    const result = validateHeight(9, 0);
    expect(result.valid).toBe(true);
    expect(result.value!.feet).toBe(8);
  });

  it('clamps inches to 0-11', () => {
    const result = validateHeight(5, 15);
    expect(result.valid).toBe(true);
    expect(result.value!.inches).toBe(11);
  });
});

// ─── validateAge ─────────────────────────────────────────────────────

describe('validateAge', () => {
  it('accepts valid age', () => {
    const result = validateAge(25);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(25);
  });

  it('clamps under-13 to min (13)', () => {
    const result = validateAge(10);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(13);
  });

  it('clamps over-120 to max (120)', () => {
    const result = validateAge(150);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(120);
  });

  it('accepts boundary values', () => {
    expect(validateAge(13).valid).toBe(true);
    expect(validateAge(120).valid).toBe(true);
  });
});

// ─── validateCalorieTarget ───────────────────────────────────────────

describe('validateCalorieTarget', () => {
  it('accepts valid calorie target', () => {
    const result = validateCalorieTarget(2000);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(2000);
  });

  it('rounds to nearest integer', () => {
    const result = validateCalorieTarget(2000.7);
    expect(result.value).toBe(2001);
  });

  it('clamps below-1000 to min (1000)', () => {
    const result = validateCalorieTarget(500);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(1000);
  });

  it('clamps above-10000 to max (10000)', () => {
    const result = validateCalorieTarget(15000);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(10000);
  });
});

// ─── validateMacroPercentages ────────────────────────────────────────

describe('validateMacroPercentages', () => {
  it('accepts valid percentages summing to 100', () => {
    const result = validateMacroPercentages(30, 40, 30);
    expect(result.valid).toBe(true);
    expect(result.value).toEqual({ protein: 30, carbs: 40, fat: 30 });
  });

  it('rejects percentages summing well below 100', () => {
    const result = validateMacroPercentages(20, 20, 20);
    expect(result.valid).toBe(false);
  });

  it('rejects percentages summing well above 100', () => {
    const result = validateMacroPercentages(50, 50, 50);
    expect(result.valid).toBe(false);
  });

  it('accepts sums in 95-105 tolerance range', () => {
    expect(validateMacroPercentages(33, 34, 33).valid).toBe(true);
    expect(validateMacroPercentages(35, 35, 33).valid).toBe(true);
  });
});

// ─── sanitizeObject ──────────────────────────────────────────────────

describe('sanitizeObject', () => {
  it('sanitizes string values in objects', () => {
    const result = sanitizeObject({ name: '<b>Test</b>', value: 42 });
    expect(result.name).toBe('Test');
    expect(result.value).toBe(42);
  });

  it('handles nested objects', () => {
    const result = sanitizeObject({ nested: { name: '<script>x</script>' } });
    expect(result.nested.name).toBe('x');
  });

  it('handles arrays', () => {
    const result = sanitizeObject([{ name: '<b>A</b>' }, { name: '<b>B</b>' }]);
    expect(result[0].name).toBe('A');
    expect(result[1].name).toBe('B');
  });

  it('returns null/primitives unchanged', () => {
    expect(sanitizeObject(null)).toBeNull();
    expect(sanitizeObject(42)).toBe(42);
    expect(sanitizeObject(true)).toBe(true);
  });
});
