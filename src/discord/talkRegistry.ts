const talkThreadIds = new Set<string>();

export function registerTalkThread(threadId: string): void {
  talkThreadIds.add(threadId);
}

export function isTalkThread(threadId: string): boolean {
  return talkThreadIds.has(threadId);
}
