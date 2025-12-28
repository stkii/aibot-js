import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export interface SecretConfig {
  discordBotToken: string;
  openaiApiKey: string;
  tokenDailyLimit: number;
}

const client = new SecretManagerServiceClient();

async function resolveProjectId(): Promise<string> {
  const fromEnv = process.env['GOOGLE_CLOUD_PROJECT_ID'];
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return client.getProjectId();
}

async function getSecretValueFor(defaultSecretId: string, options: { secretIdEnv: string }): Promise<string> {
  const projectId = await resolveProjectId();
  const secretId = process.env[options.secretIdEnv] ?? defaultSecretId;
  const name = `projects/${projectId}/secrets/${secretId}/versions/latest`;

  const [accessResponse] = await client.accessSecretVersion({ name });
  const data = accessResponse.payload?.data;

  if (!data) {
    throw new Error(`Secret "${name}" has no payload.`);
  }

  return Buffer.from(data).toString('utf8');
}

let cachedConfig: SecretConfig | null = null;

function resolveTokenDailyLimit(): number {
  const raw = process.env['TOKEN_DAILY_LIMIT'];
  if (!raw || raw.trim().length === 0) return 10000;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Environment variable "TOKEN_DAILY_LIMIT" must be a non-negative integer.');
  }
  return parsed;
}

export async function getConfig(): Promise<SecretConfig> {
  if (cachedConfig) return cachedConfig;

  const discordEnv = process.env['DISCORD_BOT_TOKEN'];
  const openaiEnv = process.env['OPENAI_API_KEY'];
  const tokenDailyLimit = resolveTokenDailyLimit();

  const [discordBotToken, openaiApiKey] = await Promise.all([
    discordEnv && discordEnv.length > 0
      ? // Use environment variable if available and non-empty
        Promise.resolve(discordEnv)
      : getSecretValueFor('DISCORD_BOT_TOKEN', {
          // otherwise fetch from Google Cloud Secret Manager
          secretIdEnv: 'DISCORD_BOT_TOKEN_SECRET_ID',
        }),
    openaiEnv && openaiEnv.length > 0
      ? Promise.resolve(openaiEnv)
      : getSecretValueFor('OPENAI_API_KEY', {
          secretIdEnv: 'OPENAI_API_KEY_SECRET_ID',
        }),
  ]);

  if (!discordBotToken) {
    throw new Error('Discord bot token is not configured.');
  }
  if (!openaiApiKey) {
    throw new Error('Secret "OPENAI_API_KEY" is not configured.');
  }

  cachedConfig = { discordBotToken, openaiApiKey, tokenDailyLimit };
  return cachedConfig;
}
