export type TokenUsageTotals = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

/**
 * Create token totals with strict invariants:
 * - input/output must be non-negative finite integers (exception if violated)
 * - total must be calculated from input + output (ignore external provided value)
 */
export function createTokenUsageTotals(params: {
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null; // 受け取るが、計算には使用しない
}): TokenUsageTotals {
  const ensureNonNegInt = (name: string, value: unknown): number => {
    const v = typeof value === 'number' ? value : 0;
    if (!Number.isFinite(v) || v < 0 || !Number.isInteger(v)) {
      throw new Error(`Invalid ${name}: expected non-negative integer.`);
    }
    return v;
  };

  const input = ensureNonNegInt('inputTokens', params.inputTokens ?? 0);
  const output = ensureNonNegInt('outputTokens', params.outputTokens ?? 0);
  const total = input + output;

  return { inputTokens: input, outputTokens: output, totalTokens: total };
}
