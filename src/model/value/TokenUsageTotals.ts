export type TokenUsageTotals = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

/**
 * Create token totals with strict invariants:
 * - input/output は 0 以上の有限整数であること（違反時は例外）
 * - total は常に input + output から算出（外部提供値は無視）
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
