import { describe, it, expect } from 'vitest';
import {
  evaluateArithmeticExpression,
  executeSandboxHook,
  recalculateAllAttributes,
} from '../formulaHooks';
import {
  validateSystemDefinition,
  validateCharacter,
  validateJSONString,
} from '../schemaValidation';
import { DEFAULT_SYSTEM } from '../../db';

describe('Formula Engine — Arithmetic & Hooks', () => {
  it('should correctly evaluate standard arithmetic expressions', () => {
    const attrs = { strength: 16, dexterity: 14 };
    const res = evaluateArithmeticExpression('floor((strength - 10) / 2)', attrs);
    expect(res.error).toBeUndefined();
    expect(res.value).toBe(3);
  });

  it('should evaluate functional hooks safely in sandbox', () => {
    const hookCode = `
      const lvl = Number(attr.level) || 1;
      if (lvl >= 17) return 6;
      if (lvl >= 9) return 4;
      return 2;
    `;
    const res1 = executeSandboxHook(hookCode, { level: 3 });
    expect(res1.value).toBe(2);

    const res2 = executeSandboxHook(hookCode, { level: 10 });
    expect(res2.value).toBe(4);

    const res3 = executeSandboxHook(hookCode, { level: 20 });
    expect(res3.value).toBe(6);
  });

  it('should prevent malicious access inside functional hooks', () => {
    const maliciousHook = `
      try {
        return typeof window !== 'undefined' ? window.location.href : 'blocked';
      } catch (e) {
        return 'blocked';
      }
    `;
    const res = executeSandboxHook(maliciousHook, {});
    expect(res.value).toBe('blocked');
  });

  it('should recalculate derived attributes with chained dependencies', () => {
    const attributes = {
      level: 5,
      strength: 18,
      dexterity: 12,
      constitution: 14,
    };

    const { values, errors } = recalculateAllAttributes(DEFAULT_SYSTEM.attributes, attributes);
    expect(errors).toEqual({});
    expect(values['strength_mod']).toBe(4);
    expect(values['dexterity_mod']).toBe(1);
    expect(values['constitution_mod']).toBe(2);
    expect(values['proficiency_bonus']).toBe(3); // Level 5 gives prof 3 via hook!
    expect(values['armor_class']).toBe(11); // 10 + dex_mod (1)
  });
});

describe('Zod Schema Validation Layer', () => {
  it('should validate the default system definition successfully', () => {
    const res = validateSystemDefinition(DEFAULT_SYSTEM);
    expect(res.success).toBe(true);
  });

  it('should catch malformed system definition and return descriptive error messages', () => {
    const badSystem = {
      id: '',
      name: '',
      attributes: 'not-an-array',
    };
    const res = validateSystemDefinition(badSystem);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors.length).toBeGreaterThan(0);
    }
  });

  it('should safely parse JSON strings and catch syntax errors without throwing', () => {
    const invalidJson = '{ bad json ';
    const res = validateJSONString(invalidJson, validateSystemDefinition);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.errors[0]).toContain('JSON Parse Error');
    }
  });
});
