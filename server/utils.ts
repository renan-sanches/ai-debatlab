
/**
 * processes items in an array asynchronously with a concurrency limit.
 * @param poolLimit The maximum number of concurrent promises.
 * @param array The array of items to process.
 * @param iteratorFn The async function to run for each item.
 * @returns A promise that resolves to an array of PromiseSettledResult.
 */
export async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const ret: Promise<R>[] = [];
  const executing: Promise<void>[] = [];

  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    if (poolLimit < array.length) {
      const e: Promise<void> = p.then(() => {
        executing.splice(executing.indexOf(e), 1);
      }).catch(() => {
        executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.allSettled(ret);
}
