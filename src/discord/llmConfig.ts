export type SlashCommandKey = 'chat' | 'talk';

const MODEL_ENV_BY_KEY: Record<SlashCommandKey, string> = {
  chat: 'CHAT_LLM_MODEL',
  talk: 'TALK_LLM_MODEL',
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function validateLlmConfig(): void {
  for (const envName of Object.values(MODEL_ENV_BY_KEY)) {
    requireEnv(envName);
  }
}

export function getLlmModel(key: SlashCommandKey): string {
  return requireEnv(MODEL_ENV_BY_KEY[key]);
}
