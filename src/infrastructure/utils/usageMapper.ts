import type { LanguageModelUsage } from 'ai';
import { createTokenUsageTotals } from '../../model/value/TokenUsageTotals';

/** Convert LanguageModelUsage (external SDK) to domain TokenUsageTotals. */
export function toTokenUsageTotals(usage: LanguageModelUsage) {
  return createTokenUsageTotals({
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? null,
  });
}
