/**
 * Serialize Gnani API requests so a single key does not hit concurrent-use
 * rate limits (429). TTS and STT both go through this queue.
 */
let queue: Promise<void> = Promise.resolve();

export function withGnaniQueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
