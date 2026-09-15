import type { AttributeDefinition, AttributeValue, FormulaCalculationResult } from '@/types';

/**
 * Sandboxed pure JavaScript execution for non-linear RPG hooks.
 * Restricted environment: only attributes and Math utility available.
 */
export function executeSandboxHook(
  hookCode: string,
  attributes: Record<string, AttributeValue>
): FormulaCalculationResult {
  try {
    // Sanitize attributes to provide numeric/clean map
    const safeAttributes = { ...attributes };

    // Create a sandboxed function with explicit parameters: attr, Math
    // Explicitly shadowing global window/document/fetch/eval to prevent escapes
    const sandboxRunner = new Function(
      'attr',
      'Math',
      'window',
      'document',
      'fetch',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      `"use strict";
      try {
        ${hookCode.includes('return') ? hookCode : `return (${hookCode});`}
      } catch (err) {
        throw new Error("Erro na execução do Hook: " + err.message);
      }`
    );

    const result = sandboxRunner(
      safeAttributes,
      Math,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    ) as unknown;

    if (typeof result === 'number' || typeof result === 'string' || typeof result === 'boolean') {
      return { value: result };
    }

    return {
      value: 0,
      error: `Hook retornou tipo inválido: ${typeof result}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido no Hook';
    return {
      value: 0,
      error: message,
    };
  }
}

/**
 * Safe evaluator for standard arithmetic RPG expressions.
 * Example: "floor((strength - 10) / 2)" or "base_ac + dex_mod + 2"
 */
export function evaluateArithmeticExpression(
  expression: string,
  attributes: Record<string, AttributeValue>
): FormulaCalculationResult {
  try {
    let sanitized = expression.trim();
    if (!sanitized) {
      return { value: 0 };
    }

    // Replace attribute names with their numeric values
    // Sort keys by descending length so "strength_mod" is replaced before "strength"
    const sortedKeys = Object.keys(attributes).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      const val = attributes[key];
      const numVal = typeof val === 'number' ? val : Number(val) || 0;
      // Regex boundary to match identifier
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      sanitized = sanitized.replace(regex, numVal.toString());
    }

    // Map common math functions
    sanitized = sanitized
      .replace(/\bfloor\b/g, 'Math.floor')
      .replace(/\bceil\b/g, 'Math.ceil')
      .replace(/\bround\b/g, 'Math.round')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\bmin\b/g, 'Math.min')
      .replace(/\bmax\b/g, 'Math.max')
      .replace(/\bsqrt\b/g, 'Math.sqrt');

    // Only allow safe characters: digits, operators, parens, Math methods, commas, periods, spaces
    const safePattern = /^[0-9+\-*/%().,\sMathfloorceilroundabsminmaxsqrt]+$/;
    if (!safePattern.test(sanitized)) {
      return {
        value: 0,
        error: `Expressão contém caracteres inválidos ou referências não resolvidas: "${expression}"`,
      };
    }

    // Evaluate in closed arithmetic scope
    const evaluator = new Function(`"use strict"; return (${sanitized});`);
    const result = evaluator() as unknown;

    if (typeof result === 'number' && !Number.isNaN(result) && Number.isFinite(result)) {
      return { value: result };
    }

    return {
      value: 0,
      error: 'Resultado aritmético indefinido ou NaN',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha na avaliação da fórmula';
    return {
      value: 0,
      error: `${message} na expressão: "${expression}"`,
    };
  }
}

/**
 * High-level resolver for an attribute: checks Hook first, then arithmetic formula, then defaultValue.
 */
export function calculateAttributeValue(
  attrDef: AttributeDefinition,
  allAttributes: Record<string, AttributeValue>
): FormulaCalculationResult {
  if (attrDef.type !== 'derived') {
    const rawVal = allAttributes[attrDef.id];
    return { value: rawVal !== undefined ? rawVal : attrDef.defaultValue };
  }

  // 1. Hook function has highest priority for non-linear / custom logic
  if (attrDef.hookFn && attrDef.hookFn.trim().length > 0) {
    return executeSandboxHook(attrDef.hookFn, allAttributes);
  }

  // 2. Standard arithmetic formula
  if (attrDef.formula && attrDef.formula.trim().length > 0) {
    return evaluateArithmeticExpression(attrDef.formula, allAttributes);
  }

  // 3. Fallback to default value
  return { value: attrDef.defaultValue };
}

/**
 * Recalculate all derived attributes for a character based on their system definition.
 * Resolves dependency order dynamically.
 */
export function recalculateAllAttributes(
  definitions: AttributeDefinition[],
  currentValues: Record<string, AttributeValue>
): {
  values: Record<string, AttributeValue>;
  errors: Record<string, string>;
} {
  const values: Record<string, AttributeValue> = { ...currentValues };
  const errors: Record<string, string> = {};

  // Initialize base attributes with defaults if not present
  for (const def of definitions) {
    if (values[def.id] === undefined) {
      values[def.id] = def.defaultValue;
    }
  }

  // Derived attributes calculation (up to 3 passes to resolve chained dependencies)
  const derivedDefs = definitions.filter((d) => d.type === 'derived');

  for (let pass = 0; pass < 3; pass++) {
    for (const def of derivedDefs) {
      const res = calculateAttributeValue(def, values);
      values[def.id] = res.value;
      if (res.error) {
        errors[def.id] = res.error;
      } else {
        delete errors[def.id];
      }
    }
  }

  return { values, errors };
}
