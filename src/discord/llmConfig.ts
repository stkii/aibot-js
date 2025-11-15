export type SlashCommandKey = 'chat' | 'talk';

const DISCORD_MODELS: Record<SlashCommandKey, string> = {
  chat: 'gpt-4o-mini',
  talk: 'gpt-4o-mini',
};

export function getLlmModel(key: SlashCommandKey): string {
  return DISCORD_MODELS[key];
}
