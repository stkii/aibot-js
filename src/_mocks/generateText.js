// Info: https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text#generatetext

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

async function main() {
  const res = await generateText({
    model: openai('gpt-4o'),
    system: 'Always respond in Japanese.',
    prompt: 'Invent a new holiday and describe its traditions.',
    maxOutputTokens: 1024,
    temperature: 0.6,
    topP: 0.96,
  });
  const text = res.text; // Generated text
  const token = res.usage; // Token usage

  console.log(text);
  console.log(token);
}

main();
