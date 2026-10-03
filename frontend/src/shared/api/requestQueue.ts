/**
 * Limits how many API requests are in flight at once.
 *
 * A screen load can mount many providers that each fire several queries. Sent
 * all at once they flood the backend's small DB pool (and the per-IP rate
 * limit), and a barcode scan fired in the middle waits behind all of them.
 * Here at most MAX_CONCURRENT run together; the rest wait their turn.
 *
 * Priority requests (scans, anything that isn't a GET, i.e. a user action)
 * jump ahead of queued background reads. A request's timeout should start only
 * once it gets a slot, so time spent waiting here never counts against it.
 */
const MAX_CONCURRENT = 4;

type Waiter = () => void;

let active = 0;
const priorityQueue: Waiter[] = [];
const normalQueue: Waiter[] = [];

export function isPriorityRequest(url: string, method: string | undefined): boolean {
  if ((method ?? "GET").toUpperCase() !== "GET") return true;
  return /\/scan(\/|\?|$)/.test(url) || /\/auth(\/|\?|$)/.test(url);
}

function next(): void {
  while (active < MAX_CONCURRENT) {
    const waiter = priorityQueue.shift() ?? normalQueue.shift();
    if (!waiter) return;
    active++;
    waiter();
  }
}

/** Resolves when a slot is free; the caller MUST call the returned release(). */
export function acquireSlot(priority: boolean): Promise<() => void> {
  return new Promise((resolve) => {
    const grant: Waiter = () => {
      let released = false;
      resolve(() => {
        if (released) return;
        released = true;
        active--;
        next();
      });
    };
    (priority ? priorityQueue : normalQueue).push(grant);
    next();
  });
}
