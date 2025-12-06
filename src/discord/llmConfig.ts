export type SlashCommandKey = 'chat' | 'talk';

const DISCORD_MODELS: Record<SlashCommandKey, string> = {
  chat: process.env['CHAT_LLM_MODEL'] as string,
  talk: process.env['TALK_LLM_MODEL'] as string,
};

export function getLlmModel(key: SlashCommandKey): string {
  return DISCORD_MODELS[key];
}
